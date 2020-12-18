const csvtojson = require('csvtojson');
const path = require('path');

const { formatDate } = require('../../util');

module.exports = () => {
  const start = async ({
    logger, config, archiver, sftp, slack, store,
  }) => {
    const { localPath, remotePath, clientId } = config;

    const getcurrentRetries = async ({ filename, status }) => {
      const currentFail = await store.getOne({ filename, status });
      if (!currentFail) return 0;
      return currentFail.retries;
    };

    const extractCsvData = async filename => {
      const files = await archiver.getDirectoryContent(localPath);
      const csvFilename = files.find(file => /.+(\.csv)$/.test(file));
      if (!csvFilename) throw new Error('File does not exist. Check to make sure the file path to your csv is correct.');

      const csvFilePath = path.join(localPath, csvFilename);

      const jsonContent = await csvtojson({ delimiter: ';', noheader: true }).fromFile(csvFilePath);
      const csvLineForFile = jsonContent.reduce((prev, { field1 }, index) => (formatDate(field1) === filename ? index : prev), 0);

      if (!csvLineForFile) throw new Error(`Line for filename does not exist in CSV daily report | Filename ${filename}`);

      const csvContent = await csvtojson({ output: 'csv' }).fromFile(csvFilePath);

      const header = 'Echoes Daily Report;\n';
      const columns = `${csvContent[0]}\n`;
      const dailyCsvContent = `${csvContent[csvLineForFile - 1]}\n`;

      return { header, columns, dailyCsvContent };
    };

    const handleCsvData = async filename => {
      const failStatus = 'failed_to_extract_csv';
      const sucessStatus = 'csv_processed';
      const remotePathWithClientId = path.join(remotePath, clientId);

      let currentRetries;
      try {
        const processedFile = await store.getOne({ filename, status: sucessStatus });
        if (processedFile) {
          logger.info(`Skipping file ${filename} | The CSV for the file has already been processed`);
          return;
        }

        logger.info(`Extracting CSV data | Filename ${filename}`);
        currentRetries = await getcurrentRetries({ filename, status: failStatus });

        const { header, columns, dailyCsvContent } = await extractCsvData(filename);

        const remoteFilename = 'daily.csv';
        const fileExists = await sftp.checkFileExists({ filename: remoteFilename, remotePath: remotePathWithClientId });

        let contentToRemoteFile;
        if (fileExists) {
          contentToRemoteFile = dailyCsvContent;
          await sftp.appendToFile({ filename: remoteFilename, remotePath: remotePathWithClientId, content: contentToRemoteFile });
        } else {
          contentToRemoteFile = [header, columns, dailyCsvContent].join('');
          await sftp.createFile({ filename: remoteFilename, remotePath: remotePathWithClientId, content: contentToRemoteFile });
        }

        if (currentRetries) await store.deleteOne({ filename, status: failStatus });
        await store.upsertOne({ filename, status: sucessStatus });
        logger.info(`Extraction of CSV data has been completed successfully | Filename ${filename}`);
      } catch (error) {
        logger.error(`Error extracting CSV data. File will be saved for future reprocessing | Filename ${filename} | Error ${error}`);
        await slack.postMessage(`Error extracting CSV data. File will be saved for future reprocessing | File ${filename}`);

        await store.upsertOne({
          filename, status: failStatus, retries: currentRetries + 1,
        });
        throw error;
      }
    };

    return { handleCsvData };
  };

  return { start };
};
