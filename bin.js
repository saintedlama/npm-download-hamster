#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const moment = require('moment');
const colors = require('colors');

var argv = yargs
  .usage('Usage: $0 <command> [options]')
  .option('registry', {
    alias: 'r',
    describe: 'Registry URL to query',
    default: 'http://registry.npmjs.com/'
  })
  .command('package', 'Get download counts and dependent package download counts for a npm package')
  .command('user', 'Get download counts for all packages of a npm user')
  .demand(2)
  .help('h')
  .alias('h', 'help')
  .argv;

switch (argv._[0]) {
  case 'package': return require('./package-download-counts')(argv._[1], argv.registry);
  case 'user': return require('./user-download-counts')(argv._[1], argv.registry);
}
