# echoes-backup-client@0.0.1

Node.js app to backup files generate by Echoes

_Note: This README was generated. Modifications can be made in [spec/README.ejs](spec/README.ejs)_

## Documentation

1. [General Info](#general-information)
2. [Testing](#testing)
3. [Database](#database)

### General Information

#### Setup

1. `nvm install 12.13.0`
2. `nvm use`

### Use

1. `npm run infra:up`
2. `npm run start`

### Testing

To run the tests:

1. Start the environment `npm run infra:up`
2. Install dependencies `npm install`
3. Run the test `npm t`

_To stop the infra `npm run infra:down`_

### Database

This project use [mongoDB](https://www.mongodb.com/) as Database to store successful and fail compression and upload tasks. These are the env variables:

```sh
MONGO_CONNECTION_STRING
SUCCESS_COLLECTION_NAME
FAIL_COLLECTION_NAME
DAILY_DATABASE_NAME
```
`MONGO_CONNECTION_STRING` defines the host address and port.

`SUCCESS_COLLECTION_NAME` and `FAIL_COLLECTION_NAME` are the name of the collections to store succesful and fail compression and upload tasks.

`DAILY_DATABASE_NAME` is the name of database.

Default values:

```sh
MONGO_CONNECTION_STRING=mongodb://localhost:27018
SUCCESS_COLLECTION_NAME=success
FAIL_COLLECTION_NAME=fail
DAILY_DATABASE_NAME=echoes-backup
```

### SFTP server

This project relies on a SFTP server to backup the files. You should provide the following env variables:

```sh
SFTP_HOSTNAME
SFTP_PORT
SFTP_USERNAME
SFTP_PASSWORD
```

Default values: 

```sh
SFTP_HOSTNAME=localhost
SFTP_PORT=2222
SFTP_USERNAME=username
SFTP_PASSWORD=password
```

### Slack

This project uses Slack to report errors optionally. You need to create an [Slack App](https://api.slack.com/apps) and provide the following env variables

```sh
SLACK_TOKEN
SLACK_CHANNEL
```

Where `SLACK_TOKEN` is the [token](https://api.slack.com/tokens) for your Slack App and `SLACK_CHANNEL` is the ID of the channel you want this app to send messages to.

**In case you do not provide both values, Slack alert messages will be deactivated**

#### Scripts 

You can execute them using `npm run [script name]`, like `npm run lint`

##### Current available tasks

- `local`: `SERVICE_ENV=local node index.js`
- `start`: `node index.js`
- `test:report`: `cross-env NODE_ENV=test jest --detectOpenHandles --forceExit --coverage`
- `test`: `cross-env NODE_ENV=test jest --detectOpenHandles --forceExit --reporters=default`
- `infra:up`: `bash -c 'docker-compose --file docker/test/docker-compose.yml --project-name echoes-backup-client-test up -d --force-recreate --build'`
- `infra:down`: `bash -c 'docker-compose --file docker/test/docker-compose.yml --project-name echoes-backup-client-test stop'`
- `lint`: `eslint .`
- `manifest`: `node_modules/make-manifest/bin/make-manifest`
- `gitLog`: `node gitLogFormatter/index.js`
- `docs`: `node spec/index.js`

#### Hooks

Check the NPM scripts in `husky > hooks` 

#### Production dependencies

- [archiver@^5.0.0](https://www.npmjs.com/package/archiver)
- [body-parser@^1.19.0](https://www.npmjs.com/package/body-parser)
- [boom@^7.3.0](https://www.npmjs.com/package/boom)
- [bunyan@^1.8.12](https://www.npmjs.com/package/bunyan)
- [chalk@^3.0.0](https://www.npmjs.com/package/chalk)
- [confabulous@^1.7.0](https://www.npmjs.com/package/confabulous)
- [cross-env@^7.0.2](https://www.npmjs.com/package/cross-env)
- [debug@^4.1.1](https://www.npmjs.com/package/debug)
- [dotenv@^8.2.0](https://www.npmjs.com/package/dotenv)
- [ejs@^3.1.5](https://www.npmjs.com/package/ejs)
- [express-swagger-generator@^1.1.15](https://www.npmjs.com/package/express-swagger-generator)
- [fs-extra@^9.0.1](https://www.npmjs.com/package/fs-extra)
- [hogan.js@^3.0.2](https://www.npmjs.com/package/hogan.js)
- [make-manifest@^1.0.1](https://www.npmjs.com/package/make-manifest)
- [moment@^2.27.0](https://www.npmjs.com/package/moment)
- [on-headers@^1.0.2](https://www.npmjs.com/package/on-headers)
- [optimist@^0.6.1](https://www.npmjs.com/package/optimist)
- [optional@^0.1.4](https://www.npmjs.com/package/optional)
- [prepper@^1.2.0](https://www.npmjs.com/package/prepper)
- [ramda@^0.26.1](https://www.npmjs.com/package/ramda)
- [ssh2-sftp-client@^5.3.0](https://www.npmjs.com/package/ssh2-sftp-client)
- [systemic@^3.3.0](https://www.npmjs.com/package/systemic)
- [systemic-domain-runner@^1.1.0](https://www.npmjs.com/package/systemic-domain-runner)
- [systemic-express@^1.1.1](https://www.npmjs.com/package/systemic-express)
- [systemic-mongodb@^2.0.2](https://www.npmjs.com/package/systemic-mongodb)
- [systemic-slack@^1.0.1](https://www.npmjs.com/package/systemic-slack)

#### Development dependencies

- [@commitlint/cli@^9.1.2](https://www.npmjs.com/package/@commitlint/cli)
- [@commitlint/config-conventional@^9.1.2](https://www.npmjs.com/package/@commitlint/config-conventional)
- [chai@^4.2.0](https://www.npmjs.com/package/chai)
- [eslint@^6.7.1](https://www.npmjs.com/package/eslint)
- [eslint-config-airbnb-base@^14.0.0](https://www.npmjs.com/package/eslint-config-airbnb-base)
- [eslint-plugin-import@^2.18.2](https://www.npmjs.com/package/eslint-plugin-import)
- [eslint-plugin-jest@^24.0.0](https://www.npmjs.com/package/eslint-plugin-jest)
- [expect.js@^0.3.1](https://www.npmjs.com/package/expect.js)
- [husky@^3.1.0](https://www.npmjs.com/package/husky)
- [jest@^26.4.2](https://www.npmjs.com/package/jest)
- [jest-config@^26.4.2](https://www.npmjs.com/package/jest-config)
- [jest-junit@^11.1.0](https://www.npmjs.com/package/jest-junit)
- [make-manifest@^1.0.1](https://www.npmjs.com/package/make-manifest)
- [supertest@^4.0.2](https://www.npmjs.com/package/supertest)

