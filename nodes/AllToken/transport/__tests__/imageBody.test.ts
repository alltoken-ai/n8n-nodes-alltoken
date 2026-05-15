import { buildImageBody } from '../imageBody';

describe('buildImageBody', () => {
	it('最小请求', () => {
		expect(buildImageBody({ model: 'gpt-image-2', prompt: 'red apple', options: {} })).toEqual({
			model: 'gpt-image-2',
			prompt: 'red apple',
		});
	});

	it('透传可选字段', () => {
		const b = buildImageBody({
			model: 'gpt-image-2',
			prompt: 'red apple',
			options: { size: '1024x1024', n: 2, quality: 'high' },
		});
		expect(b.size).toBe('1024x1024');
		expect(b.n).toBe(2);
		expect(b.quality).toBe('high');
	});

	it('prompt 为空抛错', () => {
		expect(() => buildImageBody({ model: 'm', prompt: '', options: {} })).toThrow();
	});

	it('prompt 全空白抛错', () => {
		expect(() => buildImageBody({ model: 'm', prompt: '   ', options: {} })).toThrow();
	});
});
