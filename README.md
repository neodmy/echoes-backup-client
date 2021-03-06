# echoes-backup-client@0.0.1

Node.js app to backup files generate by Echoes

_Note: This README was generated. Modifications can be made in [spec/README.ejs](spec/README.ejs)_

## Documentation

1. [General Info](#general-information)
2. [Testing](#testing)
3. [Database](#database)

### General Information

This app is thought to manage data generated by Echoes. This program is set with a root path where generates a daily folder following this name pattern `YYYY-mm-dd`. Inside this folder, there are several folders in turn, with a tree similar to this:

```sh
/gnuplot/specs/fakes
/gnuplot/specs/overdense
/gnuplot/specs
/gnuplot/specs/underdense
/screenshots/fakes
/screenshots/overdense
/screenshots/underdense
/stats
```

This application will run periodically based on a cronjob performing the following actions:

- Checks if a folder with today's date with pattern `YYYY-mm-dd` has been created by Echoes on the root path:
    - If the folder has not been created, this app will store information about this folder in the database to retry on the next cronjob execution (e.g. Echoes does not generated the file for some reason).
    - If the folder has been created, the app will compress such file generating a `YYYY-mm-dd.zip` file.
        
- In the case of a succesful compression, the app will send the `YYYY-mm-dd.zip` file to the SFTP server:
    - If the server is not available, the app will store information about this file in the database to retry on the next cronjob execution. (e.g. connection issues, the server is down, etc).
    - If the server is available, the app will send the file to the SFTP server.

- Last, The app will check if the files in the Echoes root path are in range of the `REMOVAL_OFFSET` variable. If the `YYYY-mm-dd` date included on the name of every file is older than a fixed computation (`today's date - REMOVAL_OFFSET`), the app will remove such files. This point is particularly important for machines with a limited storage.

When the app is deployed for the first time (or after a restart), it will synchornize the content of the Echoes root path performing the above algorithm.

### Setup

1. `nvm install 12.13.0`
2. `nvm use`

### Use

1. `npm run prod:up`

This `npm script` will create the neccesary containers.

_To stop the app run `npm run prod:down`_

### Testing

1. Start the environment `npm run infra:up`
2. Install dependencies `npm install`
3. Run the test `npm t`

_To stop the infra run `npm run infra:down`_

### Database

This project uses [mongoDB](https://www.mongodb.com/) as Database to store failures on compression and upload tasks. This will allow the app to perform further retries. To persist data, the database container uses a Docker-managed volume.

### SFTP server

This project relies on a SFTP server to backup the files.

### Slack

This project uses Slack to report errors optionally. You need to create an [Slack App](https://api.slack.com/apps).

You can get a [token](https://api.slack.com/tokens) for your Slack App and configure to report to a channel.

#### Scripts 

You can execute them using `npm run [script name]`, like `npm run lint`

##### Current available tasks

- `local`: `SERVICE_ENV=local node index.js`
- `start`: `node index.js`
- `test:report`: `cross-env NODE_ENV=test jest --detectOpenHandles --forceExit --coverage`
- `test`: `cross-env NODE_ENV=test jest --detectOpenHandles --forceExit --reporters=default`
- `infra:up`: `bash -c 'docker-compose --file docker/test/docker-compose.yml --project-name echoes-backup-client-test up -d --force-recreate --build'`
- `infra:down`: `bash -c 'docker-compose --file docker/test/docker-compose.yml --project-name echoes-backup-client-test stop'`
- `prod:up`: `bash -c 'docker-compose --file docker-compose.yml --project-name echoes-backup-client up -d --force-recreate --build'`
- `prod:down`: `bash -c 'docker-compose --file docker-compose.yml --project-name echoes-backup-client stop'`
- `lint`: `eslint .`
- `manifest`: `node_modules/make-manifest/bin/make-manifest`
- `gitLog`: `node gitLogFormatter/index.js`
- `docs`: `node spec/index.js`

#### Hooks

Check the NPM scripts in `husky > hooks` 

#### Dependencies

- [@slack/web-api@^5.13.0](https://www.npmjs.com/package/@slack/web-api)
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

#### Development dependencies

- [@commitlint/cli@^9.1.2](https://www.npmjs.com/package/@commitlint/cli)
- [@commitlint/config-conventional@^9.1.2](https://www.npmjs.com/package/@commitlint/config-conventional)
- [@types/jest@^26.0.15](https://www.npmjs.com/package/@types/jest)
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

