import * as vscode from 'vscode';
import { executeAgentActions } from '../agent/executor';
import { showDiffPreview } from '../diff/preview';
import { applyDiffToContent, validateDiff } from '../diff/validator';
import { callLLMForAgent, callLLMForChat, generateSessionTitle } from '../llm/stub';
import { getAvailableModels, getModel, setModel } from '../llm/provider';
import type {
	ActionExecutionResult,
	AgentAction,
	AgentResponse,
	ApprovalMode,
	ChatContext,
	LLMResponse,
	PendingDiff,
	SerializedActionResult,
} from '../types';
import { describeAction } from '../utils/format';
import { gatherChatContext } from './context';
import { SessionManager, type ChatMessage, type ChatSession } from './session';
import { getWebviewHtml } from './webview';
import type { UsageService } from '../usage/service';
import { PREMIUM_MODELS, type UsageCategory } from '../usage/types';

const MAX_AGENT_ITERATIONS = Infinity;

export class ChatViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'flixa.chatView';

	private _view?: vscode.WebviewView;
	private _extensionUri: vscode.Uri;
	private _sessionManager: SessionManager;
	private _storePendingDiff: (diff: PendingDiff) => void;
	private _agentMode: boolean = true;
	private _approvalMode: ApprovalMode = 'AUTO_APPROVE';
	private _isLoading: boolean = false;
	private _isAgentRunning: boolean = false;
	private _stopRequested: boolean = false;
	private _currentAbortController?: AbortController;
	private _usageService?: UsageService;

	constructor(
		extensionUri: vscode.Uri,
		context: vscode.ExtensionContext,
		storePendingDiff: (diff: PendingDiff) => void,
		usageService?: UsageService
	) {
		this._extensionUri = extensionUri;
		this._sessionManager = new SessionManager(context);
		this._storePendingDiff = storePendingDiff;
		this._usageService = usageService;
	}

	public clearHistory(): void {
		this._sessionManager.clearHistory();
		this._updateMessages();
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;
		webviewView.onDidDispose(() => {
			this._view = undefined;
		});

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = getWebviewHtml(
			webviewView.webview,
			this._extensionUri
		);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			if (data.type === 'ready') {
				this._updateState();
				this._updateMessages();
				this._updateSessions();
				if (this._usageService) {
					this.updateUsage(this._usageService.getCachedUsage());
				}
			} else if (data.type === 'sendMessage') {
				await this._handleUserMessage(data.message);
			} else if (data.type === 'toggleAgentMode') {
				this._agentMode = data.enabled;
				this._updateState();
			} else if (data.type === 'setApprovalMode') {
				this._approvalMode = data.mode;
				this._updateState();
			} else if (data.type === 'setModel') {
				await setModel(data.model);
				this._updateState();
			} else if (data.type === 'stopAgent') {
				this._stopRequested = true;
				this._currentAbortController?.abort();
			} else if (data.type === 'newChat') {
				this._sessionManager.createNewSession();
				this._updateMessages();
				this._updateSessions();
			} else if (data.type === 'switchChat') {
				this._sessionManager.currentSessionId = data.sessionId;
				this._updateMessages();
				this._updateSessions();
			} else if (data.type === 'deleteChat') {
				this._sessionManager.deleteSession(data.sessionId);
				this._updateMessages();
				this._updateSessions();
			} else if (data.type === 'showUsageDetail') {
				vscode.commands.executeCommand('flixa.showUsageDetail');
			} else if (data.type === 'login') {
				vscode.commands.executeCommand('flixa.login');
			} else if (data.type === 'openBilling') {
				if (this._usageService) {
					const billingUrl = this._usageService.getBillingUrl();
					vscode.env.openExternal(vscode.Uri.parse(billingUrl));
				}
			}
		});
	}

	public setAgentMode(enabled: boolean): void {
		this._agentMode = enabled;
		this._updateState();
	}

	public setApprovalMode(mode: ApprovalMode): void {
		this._approvalMode = mode;
		this._updateState();
	}

	public getAgentMode(): boolean {
		return this._agentMode;
	}

	public getApprovalMode(): ApprovalMode {
		return this._approvalMode;
	}

	private _setLoading(loading: boolean): void {
		this._isLoading = loading;
		if (!this._view) {
			return;
		}
		try {
			this._view.webview.postMessage({
				type: 'setLoading',
				loading: this._isLoading,
				agentRunning: this._isAgentRunning,
			});
		} catch { }
	}

	private _setAgentRunning(running: boolean): void {
		this._isAgentRunning = running;
		if (!running) {
			this._stopRequested = false;
		}
		if (!this._view) {
			return;
		}
		try {
			this._view.webview.postMessage({
				type: 'setLoading',
				loading: this._isLoading,
				agentRunning: this._isAgentRunning,
			});
		} catch { }
	}

	private async _handleUserMessage(message: string): Promise<void> {
		const currentSession = this._sessionManager.getCurrentSession();
		const isFirstMessage = currentSession && currentSession.messages.length === 0;

		const currentModel = getModel();
		const usageCategory: UsageCategory = PREMIUM_MODELS.includes(currentModel)
			? 'premium'
			: 'basic';

		if (this._usageService) {
			console.log('[Flixa] Checking quota for category:', usageCategory);
			const quotaCheck = this._usageService.checkQuotaAndWarn(usageCategory);
			console.log('[Flixa] Quota check result:', quotaCheck);
			if (!quotaCheck.canProceed) {
				if (quotaCheck.maxModeEligible) {
					const action = await vscode.window.showWarningMessage(
						`Deni AI: ${usageCategory} quota exhausted. Enable Max Mode to continue (additional charges apply).`,
						'Enable Max Mode',
						'Upgrade Plan'
					);
					if (action === 'Upgrade Plan') {
						vscode.env.openExternal(
							vscode.Uri.parse(this._usageService.getBillingUrl())
						);
					}
				} else {
					const action = await vscode.window.showErrorMessage(
						`Deni AI: ${usageCategory} quota exhausted. Please upgrade your plan.`,
						'Upgrade Plan'
					);
					if (action === 'Upgrade Plan') {
						vscode.env.openExternal(
							vscode.Uri.parse(this._usageService.getBillingUrl())
						);
					}
				}
				return;
			}
		}

		this._sessionManager.pushMessage({ role: 'user', content: message });
		this._updateMessages();

		if (isFirstMessage) {
			generateSessionTitle(message).then((title) => {
				this._sessionManager.updateSessionName(
					this._sessionManager.currentSessionId,
					title
				);
				this._updateSessions();
			});
		}

		const context = await gatherChatContext(
			message,
			() => this._sessionManager.getMessages(),
			() => this._sessionManager.getSessionMessages()
		);

		if (this._agentMode) {
			await this._handleAgentLoop(context, usageCategory);
		} else {
			this._setLoading(true);
			try {
				await this._handleChatMessage(context, usageCategory);
			} finally {
				this._setLoading(false);
			}
		}
	}

	private _sendStreamingUpdate(text: string): void {
		if (!this._view) {
			return;
		}
		try {
			this._view.webview.postMessage({
				type: 'streamingUpdate',
				text,
			});
		} catch { }
	}

	private async _handleAgentLoop(
		context: ChatContext,
		usageCategory: UsageCategory
	): Promise<void> {
		let iteration = 0;
		let retryCount = 0;
		const maxRetries = 3;

		this._setAgentRunning(true);

		try {
			while (iteration < MAX_AGENT_ITERATIONS) {
				if (this._stopRequested) {
					this._sessionManager.pushMessage({
						role: 'system',
						content: 'Stopped by user',
					});
					this._updateMessages();
					break;
				}

				iteration++;

				context.sessionMessages = this._sessionManager.getSessionMessages();

				this._setLoading(true);
				let response: AgentResponse | LLMResponse;
				const llmAbortController = new AbortController();
				this._currentAbortController = llmAbortController;
				try {
					response = await callLLMForAgent(
						context,
						(text) => {
							this._sendStreamingUpdate(text);
						},
						llmAbortController.signal
					);
				} finally {
					if (this._currentAbortController === llmAbortController) {
						this._currentAbortController = undefined;
					}
					this._setLoading(false);
					this._sendStreamingUpdate('');
				}

				if (this._stopRequested) {
					this._sessionManager.pushMessage({
						role: 'system',
						content: 'Stopped by user',
					});
					this._updateMessages();
					break;
				}

				if (response.type !== 'agent') {
					console.log('[Flixa] agent response non-agent', response.message);
					const retryable =
						response.message.startsWith('[API Error]') ||
						response.message === 'Empty response' ||
						response.message.startsWith('[Agent - Step');
					if (retryable && retryCount < maxRetries) {
						retryCount++;
						this._sessionManager.pushMessage({
							role: 'assistant',
							content: response.message,
						});
						this._updateMessages();
						continue;
					}
					this._sessionManager.pushMessage({
						role: 'assistant',
						content: response.message,
					});
					this._updateMessages();

					if (this._usageService) {
						this._usageService.refreshAfterSend(usageCategory);
					}
					break;
				}

				const agentResponse = response as AgentResponse;
				console.log(
					'[Flixa] agent response actions',
					agentResponse.actions.length
				);
				retryCount = 0;

				if (agentResponse.actions.length === 0) {
					this._sessionManager.pushMessage({
						role: 'assistant',
						content: `[Agent] ${agentResponse.message}`,
					});
					this._updateMessages();

					if (this._usageService) {
						this._usageService.refreshAfterSend(usageCategory);
					}
					break;
				}

				if (this._stopRequested) {
					this._sessionManager.pushMessage({
						role: 'system',
						content: 'Stopped by user',
					});
					this._updateMessages();
					break;
				}

				const onOutput = (actionDesc: string, output: string) => {
					const messages = this._sessionManager.getMessages();
					const existingIdx = messages.findIndex(
						(m) => m.role === 'executing' && m.executingAction === actionDesc
					);
					if (existingIdx >= 0) {
						messages[existingIdx].executingOutput = output;
					} else {
						this._sessionManager.pushMessage({
							role: 'executing',
							content: '',
							executingAction: actionDesc,
							executingOutput: output,
						});
					}
					this._updateMessages();
				};

				const onSafetyCheck = (actionDesc: string, checking: boolean) => {
					const messages = this._sessionManager.getMessages();
					const existingIdx = messages.findIndex(
						(m) => m.role === 'executing' && m.executingAction === actionDesc
					);
					if (checking) {
						if (existingIdx >= 0) {
							messages[existingIdx].executingOutput = "Checking if it's safe...";
						} else {
							this._sessionManager.pushMessage({
								role: 'executing',
								content: '',
								executingAction: actionDesc,
								executingOutput: "Checking if it's safe...",
							});
						}
					} else {
						// Safety check done - don't remove the card, let onOutput update it
						// or let the final cleanup remove it
					}
					this._updateMessages();
				};

				console.log('[Flixa] execute actions start');
				let results: ActionExecutionResult[];
				const actionAbortController = new AbortController();
				this._currentAbortController = actionAbortController;
				try {
					results = await executeAgentActions({
						actions: agentResponse.actions,
						approvalMode: this._approvalMode,
						storePendingDiff: this._storePendingDiff,
						onOutput,
						onSafetyCheck,
						abortSignal: actionAbortController.signal,
					});
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					results = agentResponse.actions.map((action) => ({
						action,
						success: false,
						error: message,
					}));
				} finally {
					if (this._currentAbortController === actionAbortController) {
						this._currentAbortController = undefined;
					}
				}
				console.log('[Flixa] execute actions done', results.length);

				this._sessionManager.filterMessages((m) => m.role !== 'executing');

				const serializedResults: SerializedActionResult[] = results.map(
					(r) => ({
						action: describeAction(r.action),
						success: r.success,
						rejected: r.rejected,
						rejectionReason: r.rejectionReason,
						output: r.output,
						error: r.error,
					})
				);

				this._sessionManager.pushMessage({
					role: 'result',
					content: '',
					results: serializedResults,
				});
				this._updateMessages();
			}
		} finally {
			this._setAgentRunning(false);
		}
	}

	private async _handleChatMessage(
		context: ChatContext,
		usageCategory: UsageCategory
	): Promise<void> {
		const chatAbortController = new AbortController();
		this._currentAbortController = chatAbortController;
		const response = await callLLMForChat(
			context,
			(text) => {
				this._sendStreamingUpdate(text);
			},
			chatAbortController.signal
		);
		if (this._currentAbortController === chatAbortController) {
			this._currentAbortController = undefined;
		}
		this._sendStreamingUpdate('');

		if (response.type === 'diff' && response.diff) {
			const activeFilePath = context.activeFilePath;

			const validationResult = validateDiff(
				response.diff,
				'chat',
				activeFilePath
			);

			if (!validationResult.valid) {
				this._sessionManager.pushMessage({
					role: 'assistant',
					content: `Error: ${validationResult.error}`,
				});
				this._updateMessages();
				vscode.window.showErrorMessage(`Flixa: ${validationResult.error}`);
				return;
			}

			const newContent = applyDiffToContent(
				context.activeFileText,
				response.diff
			);
			if (!newContent) {
				this._sessionManager.pushMessage({
					role: 'assistant',
					content: 'Error: Failed to apply diff to file content.',
				});
				this._updateMessages();
				vscode.window.showErrorMessage(
					'Flixa: Failed to apply diff to file content.'
				);
				return;
			}

			this._sessionManager.pushMessage({
				role: 'assistant',
				content:
					response.message + '\n\n[Diff generated - check diff preview]',
			});
			this._updateMessages();

			const editor = vscode.window.activeTextEditor;
			if (editor) {
				await showDiffPreview(
					editor.document.uri,
					context.activeFileText,
					newContent,
					'chat',
					this._storePendingDiff
				);
			}
		} else {
			this._sessionManager.pushMessage({
				role: 'assistant',
				content: response.message,
			});
			this._updateMessages();
		}

		if (this._usageService) {
			this._usageService.refreshAfterSend(usageCategory);
		}
	}

	private _updateMessages(): void {
		this._sessionManager.save();
		if (!this._view) {
			return;
		}
		try {
			this._view.webview.postMessage({
				type: 'updateMessages',
				messages: this._sessionManager.getMessages(),
			});
		} catch { }
	}

	private _updateSessions(): void {
		if (!this._view) {
			return;
		}
		try {
			this._view.webview.postMessage({
				type: 'updateSessions',
				sessions: this._sessionManager.sessions.map((s) => ({
					id: s.id,
					name: s.name,
				})),
				currentSessionId: this._sessionManager.currentSessionId,
			});
		} catch { }
	}

	private async _updateState(): Promise<void> {
		if (!this._view) {
			return;
		}
		try {
			const isLoggedIn = this._usageService ? await this._usageService.isLoggedIn() : false;
			this._view.webview.postMessage({
				type: 'updateState',
				agentMode: this._agentMode,
				approvalMode: this._approvalMode,
				selectedModel: getModel(),
				availableModels: getAvailableModels(),
				isLoggedIn,
			});
		} catch { }
	}

	public async updateUsage(data: import('../usage/types').UsageResponse | null): Promise<void> {
		if (!this._view) {
			return;
		}
		try {
			const isLoggedIn = this._usageService ? await this._usageService.isLoggedIn() : false;
			this._view.webview.postMessage({
				type: 'updateUsage',
				usage: data,
				isLoggedIn,
			});
		} catch { }
	}
}
