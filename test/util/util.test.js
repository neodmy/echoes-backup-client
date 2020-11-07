const { shouldRemove } = require('../../util');
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
