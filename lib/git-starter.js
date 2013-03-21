// __short__.js

module.exports = GitStarter;

var util = require("util");
var events = require("events");
var exec = require('child_process').exec;
var fs = require('fs');
var mkdirp = require('mkdirp');
var async = require('async');
var program = require('commander');
var rmdir = require('rmdir');

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

    if (destdir == null || destdir === "") {
        self.error("destination folder not specified");
        return;
    }
    destdir = path_nomalize(destdir);

    var remotejobs = [
        mkdir_job, chdir_job, gitclone_job, gitclean_job, readconfig_job, parseconfig_job, confirm_jobs, findfiles_jobs, applycontext_job
    ];
    var localjobs = [
        mkdir_job, chdir_job, readconfig_job, parseconfig_job, confirm_jobs, gitclone_job, gitclean_job, findfiles_jobs, applycontext_job
    ];

    if (source == null || source === "") {
        self.error("source not specified");
    } else if (source.search(/^(https?|git(\+\w)?):/) == 0) {
        srcrepo = source;
        async.series(remotejobs, complete_job);
    } else if (source.search(/\.json$/) > -1) {
        srcjson = (source.search(/^\//) == 0) ? source : process.cwd() + "/" + source;
        async.series(localjobs, complete_job);
    } else if (source.search(/^[^\/]+$/) == 0) {
        srcjson = __dirname + "/../Starters/" + source + "/starter.json";
        fs.stat(srcjson, function(err, stat) {
            if (err) {
                self.error("starter.json not found: " + source);
            } else {
                async.series(localjobs, complete_job);
            }
        });
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

    function gitclone_job(callback) {
        if (!srcrepo) {
            callback("Git repository undefined");
        } else {
            var cmd = [git_path, 'clone', '--depth', '1', srcrepo, '.'].join(" ");
            self.emit("info", cmd);
            exec(cmd, callback);
        }
    }

    function gitclean_job(callback) {
        self.emit("info", "rm -fr .git");
        rmdir('.git', callback);
    }

    function readconfig_job(callback) {
        if (!srcjson) {
            srcjson = process.cwd() + "/" + starter_json;
        }
        srcjson = path_nomalize(srcjson);
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
            if (defaults[key] == null) {
                defaults[key] = "__" + key + "__";
            }
        });

        keychk.STARTER = true;
        Object.keys(keychk).forEach(function(key) {
            var subkey = "__" + key + "__";
            context[subkey] = self.opts[key] || defaults[key] || "";
        });

        Object.keys(aliases).forEach(function(val) {
            var key = aliases[val];
            var subkey = "__" + key + "__";
            if (context[val] == null) context[val] = context[subkey];
        });

        callback(null);
    }

    function confirm_jobs(callback) {
        // no confirmation when quite mode
        if (self.flags.q) {
            callback();
            return;
        }
        var params = config["starter.parameters"] || {};
        var list = Object.keys(params);
        self.emit("info", "Parameters: " + list.join(", "));
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

        // wildcard support
        var skips = config["starter.skip"] || [];
        skips.push(".*"); // dot file
        skips = skips.map(function(file) {
            file = file.replace(/[^\?\*\-\/A-Za-z0-9_]/g,function(match) {
                return "\\" + match;
            }).replace(/\?/g, ".").replace(/\*/g, ".*");
            return file;
        });
        var skipregex = new RegExp("^(" + (skips.join("|")) + ")$");

        // digg folders recursively
        while (dir = dirs.shift()) {
            var files = fs.readdirSync(dir);
            if (!files) {
                err = "readdir failure: " + dir;
                break;
            }
            files.forEach(function(file) {
                if (err) return;
                var path = dir + "/" + file;
                path = path.replace(/^\.\//, "");
                if (file.search(skipregex) == 0) {
                    self.emit("info", path + " (SKIP)");
                    return;
                }
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
        var chkdone = {};
        async.mapSeries(list, function(ifile, cb) {
            // already applied
            if (chkdone[ifile]) {
                self.emit("info", ifile + " (SKIP)");
                cb();
                return;
            }

            var ofile = applycontext(ifile);
            if (ifile == ofile) {
                // replacing
                self.emit("info", ofile);
            } else {
                // renaming
                self.emit("info", ofile + " <- " + ifile);
            }

            // create temporary file
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
                    fs.chmod(tfile, mode, function(err) {
                        // remove old file and rename temporary file
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

            chkdone[ofile] = true;
        }, callback);
    }

    function complete_job(err) {
        if (err) {
            self.error(err);
        } else {
            self.emit("complete", list);
        }
    }

    function path_nomalize(path) {
        while (1) {
            var prev = path;
            path = path.replace(/\/\.\//g, "/");
            path = path.replace(/\/[^\.\/][^\/]*\/\.\.\//g, "/")
            if (prev === path) break;
        }
        return path;
    }
};
