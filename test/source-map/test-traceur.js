if (process.version.indexOf('v0.8') === 0) {
    return;
}
var path = require('path'),
    fs = require('fs'),
    example1 = path.resolve(__dirname, 'traceur', 'example1'),
    sourceMaps = require('../../lib/source-maps'),
    Collector = require('../../lib/collector'),
    example1Builder = path.resolve(example1, 'build.js'),
    example1Bundle = path.resolve(example1, 'greeter.js'),
    Instrumenter = require('../../lib/instrumenter'),
    vm = require('vm');

require('traceur/bin/traceur-runtime');

module.exports = {
    "with a sample traceur file": {
        setUp: function (cb) {
            require(example1Builder)(fs.createWriteStream(example1Bundle), cb);
        },
        tearDown: function (cb) {
            fs.unlink(example1Bundle, cb);
        },
        "final coverage has multiple files": function (test) {
            try {
                var cache = sourceMaps.createCache(),
                    instrumenter = new Instrumenter(),
                    generated = instrumenter.instrumentSync(fs.readFileSync(example1Bundle, 'utf8'), example1Bundle),
                    map = instrumenter.lastOriginSourceMapUrl(),
                    g = { $traceurRuntime: global.$traceurRuntime, console: console},
                    originalFileCoverage,
                    finalCoverage,
                    collector,
                    cov;

                test.ok(map);
                cache.addUrl(example1Bundle, map);
                vm.runInNewContext(generated, g);
                originalFileCoverage = g.__coverage__;
                test.ok(originalFileCoverage);
                test.equal(1, Object.keys(originalFileCoverage).length);
                collector = new Collector({transformer: cache.transformer()});
                collector.add(originalFileCoverage);
                collector.done();
                finalCoverage = collector.getFinalCoverage();
                test.ok(finalCoverage);
                test.equal(1, Object.keys(finalCoverage).length);
                cov = finalCoverage[Object.keys(finalCoverage)[0]];
                test.equal(5, Object.keys(cov.statementMap).length);
                test.equal(2, Object.keys(cov.fnMap).length);
                test.equal(1, Object.keys(cov.branchMap).length);
                test.done();
            } catch(ex) { console.log(ex); console.log(ex.stack);}
        }
    }
};