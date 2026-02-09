import * as vscode from 'vscode';
import type { UsageService } from './service';
import { getBillingUrl } from './service';

export async function showUsageDetailPanel(
	usageService: UsageService
): Promise<void> {
	const isLoggedIn = await usageService.isLoggedIn();
	if (!isLoggedIn) {
		const action = await vscode.window.showQuickPick(
			[
				{ label: '$(sign-in) Login with Deni AI', value: 'deviceAuth' },
				{ label: '$(key) Enter API Key manually', value: 'manualKey' },
			],
			{
				placeHolder: 'You are not connected to Deni AI',
			}
		);

		if (action?.value === 'deviceAuth') {
			await usageService.loginWithDeviceAuth();
		} else if (action?.value === 'manualKey') {
			const key = await vscode.window.showInputBox({
				prompt: 'Enter your Deni AI API key (starts with deni_)',
				password: true,
				validateInput: (value) => {
					if (!value.startsWith('deni_')) {
						return 'API key must start with deni_';
					}
					return null;
				},
			});
			if (key) {
				await usageService.setApiKey(key);
			}
		}
		return;
	}

	const data = usageService.getCachedUsage();
	if (!data) {
		await usageService.fetchUsage(true);
		const freshData = usageService.getCachedUsage();
		if (!freshData) {
			vscode.window.showErrorMessage('Failed to fetch usage data');
			return;
		}
		await showUsageQuickPick(usageService, freshData);
		return;
	}

	await showUsageQuickPick(usageService, data);
}

async function showUsageQuickPick(
	usageService: UsageService,
	data: import('./types').UsageResponse
): Promise<void> {
	const tierLabel = data.isTeam
		? 'Pro (Team)'
		: data.tier.charAt(0).toUpperCase() + data.tier.slice(1);
	const items: vscode.QuickPickItem[] = [];

	items.push({
		label: `$(account) Tier: ${tierLabel}`,
		description: data.status ? `(${data.status})` : '',
		kind: vscode.QuickPickItemKind.Default,
	});

	items.push({
		label: '',
		kind: vscode.QuickPickItemKind.Separator,
	});

	for (const usage of data.usage) {
		const pct = Math.round((usage.used / usage.limit) * 100);
		const bar = createProgressBar(pct);
		const categoryLabel =
			usage.category.charAt(0).toUpperCase() + usage.category.slice(1);
		items.push({
			label: `$(graph) ${categoryLabel}: ${usage.used.toLocaleString()}/${usage.limit.toLocaleString()}`,
			description: `${bar} ${usage.remaining.toLocaleString()} remaining`,
		});
	}

	if (data.periodEnd) {
		const resetDate = new Date(data.periodEnd);
		items.push({
			label: `$(calendar) Resets: ${resetDate.toLocaleDateString()}`,
			description: '',
		});
	}

	items.push({
		label: '',
		kind: vscode.QuickPickItemKind.Separator,
	});

	const maxModeStatus = data.maxModeEnabled
		? '$(check) Enabled'
		: data.maxModeEligible
			? '$(info) Eligible (not enabled)'
			: '$(x) Not available';
	items.push({
		label: `$(zap) Max Mode: ${maxModeStatus}`,
		description: '',
	});

	items.push({
		label: '',
		kind: vscode.QuickPickItemKind.Separator,
	});

	items.push({
		label: '$(refresh) Refresh',
		description: 'Fetch latest usage data',
		alwaysShow: true,
	});

	items.push({
		label: '$(link-external) Upgrade Plan',
		description: 'Open billing page in browser',
		alwaysShow: true,
	});

	items.push({
		label: '$(sign-out) Logout',
		description: 'Disconnect from Deni AI',
		alwaysShow: true,
	});

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Deni AI Usage',
		matchOnDescription: true,
	});

	if (selected?.label === '$(refresh) Refresh') {
		await usageService.fetchUsage(true);
		const freshData = usageService.getCachedUsage();
		if (freshData) {
			await showUsageQuickPick(usageService, freshData);
		}
	} else if (selected?.label === '$(link-external) Upgrade Plan') {
		vscode.env.openExternal(vscode.Uri.parse(getBillingUrl()));
	} else if (selected?.label === '$(sign-out) Logout') {
		await usageService.logout();
		vscode.window.showInformationMessage('Deni AI: Logged out');
	}
}

function createProgressBar(percentage: number): string {
	const filled = Math.round(percentage / 10);
	const empty = 10 - filled;
	return '█'.repeat(filled) + '░'.repeat(empty);
}
