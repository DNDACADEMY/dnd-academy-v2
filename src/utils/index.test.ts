import qs from 'qs';

import { checkNumber, paramsSerializer } from '.';

describe('paramsSerializer', () => {
  it('"qs.stringify"를 호출해야만 한다', () => {
    const qsSpyOn = jest.spyOn(qs, 'stringify');
    const params = {
      param1: 'apple',
      param2: 'banana',
      param3: 'orange',
    };

    const result = paramsSerializer(params);

    expect(result).toBe('param1=apple&param2=banana&param3=orange');
    expect(qsSpyOn).toHaveBeenCalledWith(params, {
      indices: false,
      arrayFormat: 'comma',
    });

    qsSpyOn.mockRestore();
  });
});

describe('checkNumber', () => {
  describe('value가 null인 경우', () => {
    it('0을 반환해야 한다', () => {
      const result = checkNumber(null);

      expect(result).toBe(0);
    });
  });

  describe('value가 null이 아닌 경우', () => {
    it('입력된 값이 반환되어야 한다', () => {
      const result = checkNumber(100);

      expect(result).toBe(100);
    });
  });
});
