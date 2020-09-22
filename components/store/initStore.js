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

    const getAll = collection => async (query = {}) => (await collection.find(query)).toArray();
    const getByFileName = collection => filename => collection.findOne({ filename });
    const getByStatus = collection => async status => (await collection.find({ status })).toArray();
    const insertOne = collection => async payload => {
      const dataToInsert = JSON.stringify(payload);
      logger.info(`${collection.namespace} | Inserting new document: ${dataToInsert}`);
      const { ops, insertedCount } = await collection.insertOne({ ...payload, date: new Date() });
      if (!insertedCount) throw new Error(`${collection.namespace} | Could not save data: ${dataToInsert}`);
      return ops[0];
    };
    const upsertOne = collection => async payload => {
      const { _id } = payload;
      const updatedPayload = { ...payload, date: new Date() };
      const { value } = await collection.findOneAndUpdate({ _id }, { $set: updatedPayload }, { returnOriginal: false, upsert: true });
      return value;
    };
    const deleteOneByFilename = collection => async filename => {
      logger.info(`${collection.namespace} | Removing one document with filename: ${filename}`);
      const { deletedCount } = await collection.deleteOne({ filename });
      if (!deletedCount) throw new Error(`${collection.namespace} | Could not delete document with filename ${filename}`);
      return deletedCount;
    };
    const deleteOne = collection => async payload => {
      const { filename, status } = payload;
      logger.info(`${collection.namespace} | Removing one document | Filename ${filename} Status: ${status}`);
      const { deletedCount } = await collection.deleteOne({ filename, status });
      if (!deletedCount) throw new Error(`${collection.namespace} | Could not delete document | Filename ${filename} Status: ${status}`);
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

    const getSuccessByStatus = getByStatus(successCollection);
    const getFailByStatus = getByStatus(failCollection);

    const insertOneSuccess = insertOne(successCollection);
    const insertOneFail = insertOne(failCollection);

    const upsertOneSuccess = upsertOne(successCollection);
    const upsertOneFail = upsertOne(failCollection);

    const deleteOneSuccessByFilename = deleteOneByFilename(successCollection);
    const deleteOneFailByFilename = deleteOneByFilename(failCollection);

    const deleteAllSuccess = deleteAll(successCollection);
    const deleteAllFail = deleteAll(failCollection);

    const deleteOneSuccess = deleteOne(successCollection);
    const deleteOneFail = deleteOne(failCollection);

    return {
      getAllSuccess,
      getAllFail,
      getSuccessByFilename,
      getFailByFilename,
      getSuccessByStatus,
      getFailByStatus,
      insertOneSuccess,
      insertOneFail,
      upsertOneSuccess,
      upsertOneFail,
      deleteOneSuccessByFilename,
      deleteOneFailByFilename,
      deleteAllSuccess,
      deleteAllFail,
      deleteOneSuccess,
      deleteOneFail,
    };
  };

  const stop = async () => {
    debug('Closing mongodb connection...');
    await mongo.close();
  };

  return { start, stop };
};
