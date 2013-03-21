#!/usr/bin/env node

var GitStarter = require("../lib/git-starter");
var pkg = require(__dirname + "/../package.json");

var flags = {};
var opts = {};
var args = [];

process.argv.concat([]).splice(2).forEach(function(arg) {
    if (arg == null) return;
    if (arg.search(/^--/) == 0) {
        var pair = arg.substr(2).split('=', 2);
        opts[pair[0]] = pair[1];
    } else if (arg.search(/^-/) == 0) {
        var key = arg.substr(1);
        flags[key] = true;
    } else {
        args.push(arg);
    }
});

if (flags.V) {
    console.log(pkg.version);
    process.exit(0);
}

if (!args.length || flags.h) {
    showHelp();
    process.exit(0);
}

if (args.length > 2) {
    showHelp("Invalid argment: " + args[2]);
    process.exit(0);
}

// create an instance
var starter = new GitStarter(opts, flags);

// success
starter.on("complete", function(result) {
    console.log("completed");
});

// failure
starter.on("error", function(err) {
    console.error("ERROR:", err);
    process.exit(1);
});

// progress
starter.on("info", function(info) {
    console.log(info);
});

var source = args[0];
var dest = args[1] || '.';
starter.applyStarter(source, dest);

function showHelp(warn) {
    if (warn) console.warn(warn);
    var node = process.argv[0].replace(/^.*\//, "");
    var script = process.argv[1].replace(/^.*\//, "");
    var usage = "Usage: " + node + " " + script + " [starterkit] [dir]\n";
    console.log(usage);
    process.exit(0);
}
