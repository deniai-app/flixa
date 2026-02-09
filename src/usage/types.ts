export type Tier = 'free' | 'plus' | 'pro';

export type UsageCategory = 'basic' | 'premium';

export interface UsageItem {
	category: UsageCategory;
	limit: number;
	used: number;
	remaining: number;
	periodStart: string;
	periodEnd: string;
}

export interface UsageResponse {
	tier: Tier;
	planId: string | null;
	status: 'active' | 'trialing' | 'canceled' | null;
	periodEnd: string | null;
	maxModeEnabled: boolean;
	maxModeEligible: boolean;
	isTeam: boolean;
	usage: UsageItem[];
}

export interface UsageErrorResponse {
	error: {
		message: string;
		type: 'authentication_error' | 'server_error';
		param: null;
		code:
			| 'missing_auth_header'
			| 'missing_api_key'
			| 'invalid_key'
			| 'expired_key'
			| 'db_error'
			| 'usage_fetch_error';
	};
}

export interface CachedUsage {
	data: UsageResponse;
	fetchedAt: number;
}

export interface DeviceAuthInitiateResponse {
	userCode: string;
	deviceCode: string;
	expiresIn: number;
}

export interface DeviceAuthPollResponse {
	approved: boolean;
	apiKey?: string;
}

export const PREMIUM_MODELS = [
	'anthropic/claude-opus-4.6',
	'openai/gpt-5.2',
	'google/gemini-3-pro-preview',
];

export const PLUS_MODELS = ['anthropic/claude-sonnet-4.5'];

export const PRO_MODELS = [
	'anthropic/claude-opus-4.5',
	'anthropic/claude-opus-4.6',
	'google/gemini-3-pro-preview',
];

export type ModelTierRequirement = 'free' | 'plus' | 'pro';

export function getModelTierRequirement(model: string): ModelTierRequirement {
	if (PRO_MODELS.includes(model)) {
		return 'pro';
	}
	if (PLUS_MODELS.includes(model)) {
		return 'plus';
	}
	return 'free';
}

export function canUseTier(userTier: Tier, requiredTier: ModelTierRequirement): boolean {
	if (requiredTier === 'free') {
		return true;
	}
	if (requiredTier === 'plus') {
		return userTier === 'plus' || userTier === 'pro';
	}
	if (requiredTier === 'pro') {
		return userTier === 'pro';
	}
	return false;
}
