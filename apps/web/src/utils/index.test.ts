import { ensureNumber } from '.';

describe('ensureNumber', () => {
  describe('value가 null인 경우', () => {
    it('0을 반환해야 한다', () => {
      const result = ensureNumber(null);

      expect(result).toBe(0);
    });
  });

  describe('value가 null이 아닌 경우', () => {
    it('입력된 값이 반환되어야 한다', () => {
      const result = ensureNumber(100);

      expect(result).toBe(100);
    });
  });
});
