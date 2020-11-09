const { shouldRemove, formatDate } = require('../../util');
const { controller: { removalOffset } } = require('../../config/test');

describe('shouldRemove', () => {
  const getFilename = (shouldBeRemoved = false) => {
    const today = new Date();
    const offset = shouldBeRemoved ? removalOffset + 1 : 0;
    today.setDate(today.getDate() - offset);
    return today.toISOString().split('T')[0];
  };

  test('should return true if the file is older than date set by the offset', () => {
    const oldFilename = getFilename(true);

    expect(shouldRemove(oldFilename, removalOffset)).toBe(true);
  });

  test('should return false if the file is not older than date set by the offset', () => {
    const oldFilename = getFilename(false);

    expect(shouldRemove(oldFilename, removalOffset)).toBe(false);
  });
});

describe('formatDate', () => {
  test('should return undefined when the input string is not a date', () => {
    const result = formatDate('not a valid date');
    expect(result).toBeUndefined();
  });

  test('should return undefined when the input is undefined', () => {
    const result = formatDate();
    expect(result).toBeUndefined();
  });

  test('should format a date when the input includes the day without "dd" format', () => {
    const result = formatDate('mié. sept. 9 2020');
    const expectResult = '2020-09-09';

    expect(result).toEqual(expectResult);
  });

  test('should format a date when the input includes the day with "dd" format', () => {
    const result = formatDate('mié. sept. 10 2020');
    const expectResult = '2020-09-10';

    expect(result).toEqual(expectResult);
  });

  test('should format dates for every possible month input', () => {
    const dates = [
      'mié. ene. 10 2020',
      'mié. feb. 10 2020',
      'mié. mar. 10 2020',
      'mié. abr. 10 2020',
      'mié. may. 10 2020',
      'mié. jun. 10 2020',
      'mié. jul. 10 2020',
      'mié. ago. 10 2020',
      'mié. sept. 10 2020',
      'mié. oct. 10 2020',
      'mié. nov. 10 2020',
      'mié. dic. 10 2020',
    ];

    dates.forEach((date, index) => {
      const formattedDate = formatDate(date);
      const expectedMonth = index + 1 < 10 ? `0${index + 1}` : index + 1;
      expect(formattedDate).toEqual(`2020-${expectedMonth}-10`);
    });
  });
});
