const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = __dirname + '/..';

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  require('path').resolve(projectRoot, 'node_modules'),
  require('path').resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
