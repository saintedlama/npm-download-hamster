'use strict';

const moment = require('moment');
const colors = require('colors');
const Table = require('cli-table');
const downloadCounts = require('npm-download-counts');
const async = require('async');
const Registry = require('npm-registry');
const ProgressBar = require('progress');

module.exports = function userDownloadCounts(username, registry) {
  var npm = new Registry({registry: registry});

  let start = moment().subtract(1, 'months').toDate();
  let end = new Date();

  npm.users.list(username, function(err, pkgs) {
    var bar = new ProgressBar('  Downloading package stats :bar :percent :etas', { total: pkgs.length, clear : true });

    async.mapSeries(pkgs, function(pkg, next) {
      downloadCounts(pkg.name, start, end, function(err, data) {
        if (err) {
          bar.tick();
          return next();
        }

        var sum = data.reduce((s, x) => s + x.count, 0);

        bar.tick();

        next(null, {
          pkg: pkg.name,
          data: data,
          sum: sum
        });
      });
    }, function(err, results) {
      if (err) { return console.log(err); }

      bar.terminate();

      results = results.filter(r => r);
      results.sort((x, y) => y.sum - x.sum);

      var table = new Table({
        head: ['Package', 'Downloads']
      });

      var sum = results.reduce((s, r) => r.sum + s, 0);
      results.forEach(r => table.push([r.pkg, r.sum]));
      table.push(['All Downloads'.bold.cyan, sum.toString().bold.cyan]);

      console.log();
      console.log(table.toString());
    });
  });
};