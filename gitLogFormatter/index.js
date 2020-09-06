const { spawnSync } = require('child_process');

const { developers } = require('../package.json');

const streamToString = stream => stream.stdout.toString('utf8').replace(/^\s+|\s+$/g, '');

const getCurrentBranch = () => streamToString(spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD']));

const getLog = () => {
  const format = 'format:- %h %s by <¿>%an<¿>';
  const currentBranch = getCurrentBranch();
  const selectedBranch = currentBranch === 'master' ? 'master' : `master..${currentBranch}`;
  const logs = spawnSync('git', ['log', `${selectedBranch}`, `--pretty=${format}`]).stdout.toString('utf8');
  return logs;
};

const replaceLogName = () => {
  const commits = getLog().split(/\r?\n/);
  return commits.map(commit => {
    const match = /<¿>(.+)?<¿>/.exec(commit);
    const username = match && developers[match[1]];
    if (username) return commit.replace(`${match[0]}`, `@${username}`);
    return commit.replace(/<¿>/g, '');
  }).join('\n').concat('\n');
};

process.stdout.write(replaceLogName());
