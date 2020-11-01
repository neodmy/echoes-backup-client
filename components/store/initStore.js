const debug = require('debug')('service:daily-store');

module.exports = () => {
  let mongoDb;

  const start = async ({ config, logger, mongo }) => {
    const { collection: collectionName, database } = config;
    mongoDb = mongo;

    logger.info(`Initializing store. Database: ${database}. Collection: ${collectionName}`);
    debug(`Initializing store. Database: ${database}. Collection: ${collectionName}`);

    const collection = mongo.db(database).collection(collectionName);

    const getAll = async (query = {}) => (await collection.find(query)).toArray();

    const getOne = async (query = {}) => collection.findOne(query);

    const upsertOne = async payload => {
      const { filename, status } = payload;
      logger.info(`${collection.namespace} | Upserting one document | Filename ${filename} Status: ${status}`);

      const updatedPayload = { ...payload, date: new Date() };
      const { value } = await collection.findOneAndUpdate({ filename, status }, { $set: updatedPayload }, { returnOriginal: false, upsert: true });
      return value;
    };

    const deleteOne = async payload => {
      const { filename, status } = payload;
      logger.info(`${collection.namespace} | Removing one document | Filename ${filename} Status: ${status}`);

      const { deletedCount } = await collection.deleteOne({ filename, status });
      return deletedCount;
    };
    const deleteAll = async () => {
      logger.info(`${collection.namespace} | Removing all documents`);
      await collection.deleteMany({});
    };

    return {
      getAll,
      getOne,
      upsertOne,
      deleteOne,
      deleteAll,
    };
  };

  const stop = async () => {
    debug('Closing mongodb connection...');
    await mongoDb.close();
  };

  return { start, stop };
};
