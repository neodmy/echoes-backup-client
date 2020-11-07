const shouldRemove = (filename, removalOffset) => {
  if (!removalOffset) return false;
  const removalDate = new Date();
  removalDate.setDate(removalDate.getDate() - removalOffset);
  const fileDate = new Date(filename);
  return removalDate > fileDate;
};

module.exports = {
  shouldRemove,
};
