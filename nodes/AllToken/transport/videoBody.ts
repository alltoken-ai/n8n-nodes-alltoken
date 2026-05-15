export interface VideoOptions {
	duration?: number;
	resolution?: string;
	ratio?: string;
}

export interface BuildVideoBodyInput {
	model: string;
	prompt: string;
	options: VideoOptions;
}

export interface VideoRequestBody {
	model: string;
	prompt: string;
	duration?: number;
	resolution?: string;
	ratio?: string;
}

/** Pure function: assemble the AllToken video generation request body. */
export function buildVideoBody(input: BuildVideoBodyInput): VideoRequestBody {
	if (!input.prompt?.trim()) {
		throw new Error('Prompt is required for video generation.');
	}
	const body: VideoRequestBody = { model: input.model, prompt: input.prompt };
	const { duration, resolution, ratio } = input.options;
	if (typeof duration === 'number') body.duration = duration;
	if (resolution) body.resolution = resolution;
	if (ratio) body.ratio = ratio;
	return body;
}
