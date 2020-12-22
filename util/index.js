const shouldRemove = (filename, removalOffset) => {
  if (!removalOffset) return false;
  const removalDate = new Date();
  removalDate.setDate(removalDate.getDate() - removalOffset);
  const fileDate = new Date(filename);
  return removalDate > fileDate;
};

// input format: mié. sept. 9 2020 or other string
const formatDate = input => {
  const monthMapping = {
    ene: '01',
    feb: '02',
    mar: '03',
    abr: '04',
    may: '05',
    jun: '06',
    jul: '07',
    ago: '08',
    sept: '09',
    oct: '10',
    nov: '11',
    dic: '12',
  };

  const firstSplit = (input && input.split('. ')) || [];
  let formattedDate;
  if (firstSplit.length === 3) {
    const month = firstSplit[1];
    const monthToDigitString = monthMapping[month];
    const [day, year] = firstSplit[2].split(' ');
    const formatDay = day < 10 ? `0${day}` : `${day}`;
    formattedDate = [year, monthToDigitString, formatDay].join('-');
  }
  return formattedDate;
};

const asyncForEach = async (array, callback) => {
  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
};

const getPreviousDay = () => {
  const dateToProcess = new Date();
  dateToProcess.setDate(dateToProcess.getDate() - 1);
  return dateToProcess.toISOString().split('T')[0];
};

module.exports = {
  shouldRemove,
  formatDate,
  asyncForEach,
  getPreviousDay,
};
