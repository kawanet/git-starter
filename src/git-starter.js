// __short__.js

module.exports = GitStarter;

var util = require("util");
var events = require("events");
var exec = require('child_process').exec;
var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var program = require('commander');

var git_path = 'git';
var starter_json = 'starter.json'

function GitStarter(opts, flags) {
    events.EventEmitter.call(this);
    this.flags = flags || {};
    this.opts = opts || {};
}

util.inherits(GitStarter, events.EventEmitter);

GitStarter.prototype.error = function(err) {
    if ("string" == typeof err) err = new Error(err);
    this.emit("error", err);
};

GitStarter.prototype.applyStarter = function(source, destdir) {
    var srcrepo;
    var srcjson;
    var config;
    var context = {};
    var list = [];
    var self = this;
    var srcdir = ".";
    var regexp;

    if (source == null || source === "") {
        self.error("empty source");
    } else if (source.search(/^(https?|git(\+\w)?):/) == 0) {
        srcrepo = source;
        async.series([
            mkdir_job, chdir_job, gitinit_job, gitpull_job, readconfig_job, parseconfig_job, confirm_jobs, findfiles_jobs, applycontext_job
        ], complete_job);
    } else if (source.search(/\.json$/) > -1) {
        srcjson = (source.search(/^\//) == 0) ? source : process.cwd() + "/" + source;
        async.series([
            mkdir_job, chdir_job, readconfig_job, parseconfig_job, confirm_jobs, gitinit_job, gitpull_job, findfiles_jobs, applycontext_job
        ], complete_job);
    } else {
        self.error("invalid source: " + source);
    }

    function mkdir_job(callback) {
        fs.readdir(destdir, function(err, files) {
            if (err) {
                // directory is not exist
                self.emit("info", "mkdir -p " + destdir);
                mkdirp(destdir, callback);
            } else if (files.length) {
                // directory is not empty
                callback("directory is not empty: " + destdir);
            } else {
                // directory is exist and empty
                callback(null);
            }
        });
    }

    function chdir_job(callback) {
        self.emit("info", "cd " + destdir);
        try {
            process.chdir(destdir);
        } catch (err) {
            callback(err);
        }
        callback(null);
    }

    function gitinit_job(callback) {
        var gitinit = [git_path, 'init'].join(" ");
        self.emit("info", gitinit);
        exec(gitinit, callback);
    }

    function gitpull_job(callback) {
        if (!srcrepo) {
            callback("Git repository undefined");
        } else {
            var gitpull = [git_path, 'pull', srcrepo].join(" ");
            self.emit("info", gitpull);
            exec(gitpull, callback);
        }
    }

    function readconfig_job(callback) {
        if (!srcjson) {
            srcjson = process.cwd() + "/" + starter_json;
        }
        self.emit("info", "Loading: " + srcjson);
        try {
            config = require(srcjson);
        } catch (err) {
            callback(err);
        }
        callback(null);
    }

    function parseconfig_job(callback) {
        if (!config) {
            callback("empty starter.json: " + srcjson);
            return;
        }
        var ver = config["starter.version"];
        if (!ver) {
            callback('"starter.version" not found: ' + srcjson);
            return;
        }
        if (!srcrepo && config.repository) {
            srcrepo = config.repository;
        }

        var keychk = {};
        var aliases = {};
        var defaults = {};

        Object.keys(self.opts).forEach(function(key) {
            keychk[key] = true;
        });

        Object.keys(config).forEach(function(key) {
            var val = config[key];
            if (key.search(/^starter\./) == 0) return;
            if ("string" == typeof val) {
                keychk[key] = true;
                aliases[val] = key;
                defaults[key] = val;
            }
        });

        var cwd = process.cwd().replace(/^.*\//, "");
        defaults.name = cwd;
        defaults.description = cwd.replace(/-/g, " ");
        defaults.short = cwd.toLowerCase().replace(/\W+/g, "");

        var params = config["starter.parameters"] || {};
        Object.keys(params).forEach(function(key) {
            var prm = params[key];
            if ("string" == typeof prm) {
                params[key] = { description: prm };
            }
            if (prm.description != null) {
                defaults[key] = prm.description;
            }
            keychk[key] = true;
        });

        Object.keys(keychk).forEach(function(key) {
            var subkey = "__" + key + "__";
            var defval = "__" + key + "__";
            context[subkey] = self.opts[key] || defaults[key] || defval;
        });

        Object.keys(aliases).forEach(function(val) {
            var key = aliases[val];
            var subkey = "__" + key + "__";
            if (context[val] == null) context[val] = context[subkey];
        });

        callback(null);
    }

    function confirm_jobs(callback) {
        var params = config["starter.parameters"] || {};
        var list = Object.keys(params);
        async.mapSeries(list, function(key, cb) {
            var subkey = "__" + key + "__";
            var prm = params[key] || {};
            var desc = prm.description ? ": " + prm.description : "";
            var prompt = key + desc + ' ("' + context[subkey] + '"): ';
            program.promptSingleLine(prompt, function(val) {
                if (val != "") {
                    context[subkey] = val;
                }
                cb(null);
            });
        }, function(err) {
            process.stdin.destroy();
            callback(err);
        });
    }

    function findfiles_jobs(callback) {
        var dirs = ["."];
        var dir;
        var err;
        while (dir = dirs.shift()) {
            var files = fs.readdirSync(dir);
            if (!files) {
                err = "readdir failure: " + dir;
                break;
            }
            files.forEach(function(file) {
                if (err) return;
                // ignore dot files
                if (file.search(/^\./) == 0) return;
                var path = dir + "/" + file;
                var stats = fs.statSync(path);
                if (!stats) {
                    err = "stat failure: " + path;
                } else if (stats.isFile()) {
                    list.push(path);
                } else if (stats.isDirectory()) {
                    dirs.push(path);
                }
            });
        }
        callback(err);
    }

    function applycontext(src) {
        if (!regexp) {
            var keys = Object.keys(context).sort(function(a, b) {
                return b.length - a.length;
            }).map(function(str) {
                return str.replace(/[\!-\/\:-\@\[-\^\`\{-\}\~]/g, function(match) {return "\\" + match;})
            }).join("|");
            regexp = new RegExp(keys, "g");
        }

        var dst = ("" + src).replace(regexp, function(match) {
            return context[match];
        });
        return dst;
    }

    function applycontext_job(callback) {
        async.mapSeries(list, function(ifile, cb) {
            var ofile = applycontext(ifile);
            self.emit("info", ofile);
            var tfile = ofile + ".tmp";

            fs.readFile(ifile, {encoding: "utf8"}, function(err, str) {
                if (err) {
                    cb(err);
                    return;
                }
                var out = applycontext(str);
                var stat = fs.statSync(ifile);
                var mode = stat && stat.mode || 0644;
                fs.writeFile(tfile, out, {encoding: "utf8"}, function(err) {
                    fs.chmod(tfile, mode, function(err){
                        fs.unlink(ifile, function(err) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            fs.rename(tfile, ofile, cb);
                        });
                    });
                });
            });
        }, callback);
    }

    function complete_job(err) {
        if (err) {
            self.error(err);
        } else {
            self.emit("complete", list);
        }
    }
};