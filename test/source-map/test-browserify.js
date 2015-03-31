var path = require('path'),
    fs = require('fs'),
    example1 = path.resolve(__dirname, 'browserify', 'example1'),
    sourceMaps = require('../../lib/source-maps'),
    Collector = require('../../lib/collector'),
    os = require('os'),
    tmpdir = os.tmpdir || os.tmpDir,
    example1Builder = path.resolve(example1, 'build.js'),
    example1Bundle = path.resolve(tmpdir(), 'bundle.js'),
    Instrumenter = require('../../lib/instrumenter'),
    vm = require('vm');

module.exports = {
    "with a sample browserify bundle": {
        setUp: function (cb) {
            require(example1Builder)(fs.createWriteStream(example1Bundle), cb);
        },
        tearDown: function (cb) {
            fs.unlink(example1Bundle, cb);
        },
        "final coverage has multiple files": function (test) {
            var cache = sourceMaps.createCache(),
                instrumenter = new Instrumenter(),
                generated = instrumenter.instrumentSync(fs.readFileSync(example1Bundle, 'utf8'), example1Bundle),
                map = instrumenter.lastOriginSourceMapUrl(),
                g = {},
                originalFileCoverage,
                finalCoverage,
                collector;

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
            test.equal(4, Object.keys(finalCoverage).length);
            test.done();
        }
    }
};