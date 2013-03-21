// starter.test.js

var expect = require('chai').expect;
var GitStarter = require("../lib/git-starter");

describe('GitStarter', function() {

    describe('#applyStarter', function() {
        var starter;
        var opts = {};
        var args = {};

        beforeEach(function() {
            starter = new GitStarter(opts, args);
        });

        it('emit "error" on failure', function(done) {
            starter.on("error", function(err) {
                done();
            });
            starter.applyStarter();
        });

        // TODO: ADD MORE TESTS
    });
});
