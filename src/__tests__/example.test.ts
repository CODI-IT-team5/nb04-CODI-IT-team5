import { describe, expect, it } from '@jest/globals';

describe('Example Test', () => {
  it('기본 산술 연산이 올바르게 작동해야 함', () => {
    expect(1 + 1).toBe(2);
  });

  it('문자열 연결이 올바르게 작동해야 함', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });

  it('배열에 요소가 포함되어 있는지 확인', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toContain(3);
  });

  it('객체 속성 확인', () => {
    const obj = { name: 'Test', value: 123 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
  });
});

describe('Async Test Example', () => {
  it('Promise가 resolve되어야 함', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });

  it('Promise가 reject되어야 함', async () => {
    const promise = Promise.reject(new Error('error'));
    await expect(promise).rejects.toThrow('error');
  });
});
