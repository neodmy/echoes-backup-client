const debug = require('debug')('service:daily-store');

module.exports = () => {
  let mongo;

  const start = async ({ config, logger, mongodb }) => {
    const { collections, databaseName } = config;
    const initializingMessage = `Initializing "daily" store. Database name: ${databaseName}. Collection names: ${Object.values(collections).join(', ')}`;
    logger.info(`${initializingMessage}`);
    debug(`${initializingMessage}`);
    mongo = mongodb;

    const { success, fail } = collections;
    const successCollection = mongo.db(databaseName).collection(success);
    const failCollection = mongo.db(databaseName).collection(fail);

    const getAll = collection => async () => (await collection.find({})).toArray();
    const getByFileName = collection => filename => collection.findOne({ filename });
    const insertOne = collection => async payload => {
      const dataToInsert = JSON.stringify(payload);
      logger.info(`${collection.namespace} | Inserting new document: ${dataToInsert}`);
      const { ops, insertedCount } = await collection.insertOne({ ...payload, date_sent: new Date() });
      if (!insertedCount) throw new Error(`${collection.namespace} | Could not save data: ${dataToInsert}`);
      return ops[0];
    };
    const deleteOneByFilename = collection => async filename => {
      logger.info(`${collection.namespace} | Removing one document with filename: ${filename}`);
      const { deletedCount } = await collection.deleteOne({ filename });
      if (!deletedCount) throw new Error(`${collection.namespace} | Could not delete document with filename ${filename}`);
      return deletedCount;
    };
    const deleteAll = collection => async () => {
      logger.info(`${collection.namespace} | Removing all documents`);
      await collection.deleteMany({});
    };

    const getAllSuccess = getAll(successCollection);
    const getAllFail = getAll(failCollection);

    const getSuccessByFilename = getByFileName(successCollection);
    const getFailByFilename = getByFileName(failCollection);

    const insertOneSuccess = insertOne(successCollection);
    const insertOneFail = insertOne(failCollection);

    const deleteOneSuccessByFilename = deleteOneByFilename(successCollection);
    const deleteOneFailByFilename = deleteOneByFilename(failCollection);

    const deleteAllSuccess = deleteAll(successCollection);
    const deleteAllFail = deleteAll(failCollection);

    return {
      getAllSuccess,
      getAllFail,
      getSuccessByFilename,
      getFailByFilename,
      insertOneSuccess,
      insertOneFail,
      deleteOneSuccessByFilename,
      deleteOneFailByFilename,
      deleteAllSuccess,
      deleteAllFail,
    };
  };

  const stop = async () => {
    debug('Closing mongodb connection...');
    await mongo.close();
  };

  return { start, stop };
};
