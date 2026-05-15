import { buildVideoBody } from '../videoBody';

describe('buildVideoBody', () => {
	it('最小请求', () => {
		expect(buildVideoBody({ model: 'seedance-1.5-pro', prompt: 'a cat', options: {} })).toEqual({
			model: 'seedance-1.5-pro',
			prompt: 'a cat',
		});
	});

	it('透传可选字段', () => {
		const b = buildVideoBody({
			model: 'seedance-2.0',
			prompt: 'a cat walking',
			options: { duration: 6, resolution: '720p', ratio: '16:9' },
		});
		expect(b.duration).toBe(6);
		expect(b.resolution).toBe('720p');
		expect(b.ratio).toBe('16:9');
	});

	it('prompt 为空抛错', () => {
		expect(() => buildVideoBody({ model: 'm', prompt: '', options: {} })).toThrow();
	});

	it('prompt 全空白抛错', () => {
		expect(() => buildVideoBody({ model: 'm', prompt: '\t  ', options: {} })).toThrow();
	});

	it('duration=0 不透传 (typeof check 保留 0 行为)', () => {
		// 0 is invalid per API; we still want it through for the API to reject — but
		// if user leaves duration unset, body has no `duration` key. Mirror imageBody's `n` rule.
		const b = buildVideoBody({ model: 'm', prompt: 'p', options: { duration: 0 } });
		expect(b.duration).toBe(0);
	});
});
