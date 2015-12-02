'use strict';

const moment = require('moment');
const colors = require('colors');
const Table = require('cli-table');
const downloadCounts = require('npm-download-counts');
const async = require('async');
const Registry = require('npm-registry');
const ProgressBar = require('progress');

module.exports = function packageDownloadCounts(pkg, registry) {
  var npm = new Registry({registry: registry});

  let start = moment().subtract(1, 'months').toDate();
  let end = new Date();

  downloadCounts(pkg, start, end, function(err, data) {
    if (err) { return console.log(err); }

    var pkgSum = data.reduce((s, x) => s + x.count, 0);

    npm.packages.depended(pkg, function(err, depended) {
      if (err) { return console.log(err); }

      var bar = new ProgressBar('  downloading :bar :percent :etas', { total: depended.length, clear : true });

      async.mapSeries(depended.map(p => p.name), function(pkg, next) {
        downloadCounts(pkg, start, end, function(err, data) {
          if (err) {
            bar.tick();
            return next();
          }

          var sum = data.reduce((s, x) => s + x.count, 0);

          bar.tick();

          next(null, {
            pkg: pkg,
            data: data,
            sum: sum
          });
        });
      }, function(err, results) {
        if (err) { return console.log(err); }

        bar.terminate();

        results = results.filter(r => r);
        results.sort((x, y) => y.sum - x.sum);

        var sum = results.reduce((s, c) => s + c.sum, 0);

        var table = new Table({
          head: ['Package', 'Downloads']
        });

        results.map(r => [r.pkg, r.sum]).forEach(line => table.push(line));
        table.push(['Dependent Package Downloads'.bold.green, sum.toString().bold.green]);
        table.push(['Direct Downloads'.bold.magenta, (pkgSum - sum).toString().bold.magenta]);
        table.push(['All Downloads'.bold.cyan, pkgSum.toString().bold.cyan]);

        console.log();
        console.log(table.toString());
      });
    });
  });
};