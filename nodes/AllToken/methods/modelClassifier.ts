export type ModelCapability = 'chat' | 'image' | 'video' | 'unknown';

/**
 * 一个 model 条目可能来自 /v1/models (含 owned_by) 或 /api-account/models (含 output_modalities)。
 * 字段都标可选 —— 不同端点返回不同的子集。
 */
export interface ModelEntry {
	id: string;
	output_modalities?: string[];
	owned_by?: string | null;
}

/**
 * 决定一个 model 的能力分类。优先级：
 *   1. output_modalities（/api-account/models 的权威字段）
 *   2. owned_by（/v1/models 的信号，目前只有 'chat'）
 *   3. id 前缀（最后的降级 —— catalog 不返回视频模型，必须靠这条认出 seedance/happyhorse 等）
 *   4. unknown
 */
export function classifyModel(m: ModelEntry): ModelCapability {
	// 1. output_modalities
	if (m.output_modalities && m.output_modalities.length > 0) {
		if (m.output_modalities.includes('image')) return 'image';
		if (m.output_modalities.includes('video')) return 'video';
		if (m.output_modalities.includes('text')) return 'chat';
	}
	// 2. owned_by
	if (m.owned_by === 'chat') return 'chat';
	if (m.owned_by === 'image') return 'image';
	if (m.owned_by === 'video') return 'video';
	// 3. id 前缀
	const id = (m.id ?? '').toLowerCase();
	if (/^(gpt-image|dalle|stable-diffusion|imagen|flux|midjourney)/.test(id)) return 'image';
	if (/^(seedance|happyhorse|sora|kling|runway|luma)/.test(id)) return 'video';
	if (/^(claude|deepseek|gemini|glm|qwen|kimi|minimax|mimo|gpt-(?!image)|o\d|llama|mistral)/.test(id)) return 'chat';
	return 'unknown';
}
