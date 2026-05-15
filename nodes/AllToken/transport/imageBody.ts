export interface ImageOptions {
	size?: string;
	n?: number;
	quality?: string;
	style?: string;
}

export interface BuildImageBodyInput {
	model: string;
	prompt: string;
	options: ImageOptions;
}

export interface ImageRequestBody {
	model: string;
	prompt: string;
	size?: string;
	n?: number;
	quality?: string;
	style?: string;
}

/** Pure function: assemble the AllToken image generation request body. */
export function buildImageBody(input: BuildImageBodyInput): ImageRequestBody {
	if (!input.prompt?.trim()) {
		throw new Error('Prompt is required for image generation.');
	}
	const body: ImageRequestBody = { model: input.model, prompt: input.prompt };
	const { size, n, quality, style } = input.options;
	if (size) body.size = size;
	if (typeof n === 'number') body.n = n;
	if (quality) body.quality = quality;
	if (style) body.style = style;
	return body;
}
