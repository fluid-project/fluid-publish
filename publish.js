/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

"use strict";

var pkg = require("./package.json");
var execSync = require("child_process").execSync;

var publish = {};

publish.getCLIOpts = function () {
    var opts = {
        options: {}
    };
    // print process.argv
    process.argv.forEach(function(val, index) {
        if (index > 1) {
            // console.log(index + ': ' + val);
            var opt = val.split("=");

            // convert "false" to boolean
            if (opt[1] === "false") {
                opt[1] = false;
            }

            opts[opt[0]] = opt.length < 2 ? true : opt[1];
        }
    });
    console.log("opts: " + JSON.stringify(opts));
    return opts;
};

// @param num {Number}
// @param with {Number} - the min-width of the number,
//                        if the number is shorter it will be padded with zeros on the left
// @returns {String} - a string representation of the number with padding as needed
publish.padZeros = function (num, width) {
    width = width || 2;
    var numstr = num ? num.toString() : "";

    for (var i = numstr.length; i < width; i++) {
        numstr = "0" + numstr;
    }

    return numstr;
};

// @param timestamp {String} - timestamp in seconds as returned by "git show -s --format=%ct HEAD"
// @returns {Object} - an object of date properties
publish.fromTimestamp = function (timestamp) {
    var timestampInMS = Number(timestamp) * 1000;
    var date = new Date(timestampInMS);

    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1, // months are zero based by default
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds()
    };
};

// @param timestamp {String} - timestamp in seconds as returned by "git show -s --format=%ct HEAD"
// @returns {String} - the time in the ISO8601 format yyyymmddThhmmssZ
publish.convertoISO8601 = function (timestamp) {
    var date = publish.fromTimestamp(timestamp);

    for (var key in date) {
        date[key] = publish.padZeros(date[key]);
    }

    return date.year + date.month + date.day + "T" + date.hours + date.minutes + date.seconds + "Z";
};

publish.gitChanges = execSync("git status -s -uno");
publish.timestamp = execSync("git show -s --format=%ct HEAD");
publish.commitHash = execSync("git rev-parse --verify --short HEAD");
publish.devVersion = [pkg.version, publish.convertoISO8601(publish.timestamp), publish.commitHash].join(".");

publish.checkChanges = function () {
    if (publish.gitChanges.length) {
        throw new Error("You have uncommitted changes\n" + publish.gitChanges);
    }
};

publish.dev = function (options) {
    publish.checkChanges();
    // if (publish.gitChanges.length) {
    //     console.log("Error: you have uncommitted changes\n" + publish.gitChanges);
    // } else {
        // set the version number
        execSync("npm version --no-git-tag-version " + publish.devVersion);

        // publish to npm
        // execSync("npm publish");
        execSync("npm pack");

        // add dist-tag
        // execSync("npm dist-tag add infusion@" + publish.devVersion + " dev");
        console.log("npm dist-tag add infusion@" + publish.devVersion + " dev");

        // cleanup changes
        execSync("git reset HEAD --hard");
    // }
};

publish.release = function (options) {
    // publish to npm
    // execSync("npm publish");
    execSync("npm pack");
};

module.exports = publish.publish;

if (require.main === module) {

    publish.getCLIOpts();
    publish.dev();
}
