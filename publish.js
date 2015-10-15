/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

"use strict";

var publish = {};
var pkg = require("./package.json");
publish.execSync = require("child_process").execSync;
// TODO: The supported version of node.js does not yet support ES6 template strings
// When version node.js 4.x.x is supported this can be replaced by native support.
var es6Template = require("es6-template-strings");

var defaults = pkg.defaultOptions;

// From dedupe-infusion ( https://github.com/fluid-project/dedupe-infusion )
// Licensed under BSD-3-Clause
publish.shallowMerge = function (target/*,  ... */) {
    for (var arg = 1; arg < arguments.length; ++arg) {
        var source = arguments[arg];
        for (var key in source) {
            target[key] = source[key];
        }
    }
    return target;
};

/**
 * Processes the argv command line arguments into an object
 *
 * @returns {Object} - the CLI arguments as an options object
 */
publish.getCLIOpts = function () {
    var opts = {
        options: {}
    };
    // print process.argv
    process.argv.forEach(function(val, index) {
        if (index > 1) {
            var opt = val.split("=");

            // convert "false" to boolean
            if (opt[1] === "false") {
                opt[1] = false;
            }

            opts[opt[0]] = opt.length < 2 ? true : opt[1];
        }
    });
    return opts;
};

/**
 * Creaes a number with 0's padded on the left
 *
 * @param num {Number}
 * @param with {Number} - the min-width of the number,
 *                        if the number is shorter it will be padded with zeros on the left
 * @returns {String} - a string representation of the number with padding as needed
 */
publish.padZeros = function (num, width) {
    width = width || 2;
    var numstr = num ? num.toString() : "";

    for (var i = numstr.length; i < width; i++) {
        numstr = "0" + numstr;
    }

    return numstr;
};

/**
 * Creates a date object from a git timestamp
 *
 * @param timestamp {String} - timestamp in seconds as returned by "git show -s --format=%ct HEAD"
 * @returns {Object} - an object of date properties
 */
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

/**
 * Converts a git timestamp into an ISO8601 timestamp
 *
 * @param timestamp {String} - timestamp in seconds as returned by "git show -s --format=%ct HEAD"
 * @returns {String} - the time in the ISO8601 format yyyymmddThhmmssZ
 */
publish.convertToISO8601 = function (timestamp) {
    var date = publish.fromTimestamp(timestamp);

    for (var key in date) {
        date[key] = publish.padZeros(date[key]);
    }

    return date.year + date.month + date.day + "T" + date.hours + date.minutes + date.seconds + "Z";
};

/**
 * Throws an error if there are any uncommitted changes
 *
 * @param options {Object} - e.g. {"changes": "git status -s -uno"}
 * @throws Error - An error object with a message containing a list of uncommitted changes.
 */
publish.checkChanges = function (options) {
    var cmdStr = options.changes || defaults.changes;
    var changes = publish.execSync(cmdStr);
    if (changes.length) {
        throw new Error("You have uncommitted changes\n" + changes);
    }
};

/**
 * Updates the package.json version to the specified version
 * This does not commit the change, it will only modify the file.
 *
 * @param version {String} - the version to set in the package.json file
 * @param options {Object} - e.g. {"version": "npm version --no-git-tag-version ${version}"}
 */
publish.setVersion = function (version, options) {
    var cmdTemplate = options.version || defaults.version;
    var cmdStr = es6Template(cmdTemplate, {
        version: version
    });
    publish.execSync(cmdStr);
};

/**
 * Calculates the current dev version of the package
 *
 * @param options {Object} - e.g. {"rawTimestamp": "git show -s --format=%ct HEAD", "revision": "git rev-parse --verify --short HEAD", "devVersion": "${version}.${timestamp}.${revision}"}
 * @returns {String} - the current dev version number
 */
publish.getDevVersion = function (options) {
    var rawTimestamp = publish.execSync(options.rawTimestamp || defaults.rawTimestamp);
    var timestamp = publish.convertToISO8601(rawTimestamp);
    var revision = publish.execSync(options.revision || defaults.revision);
    var devVersionTemplate = options.devVersion || defaults.devVersion;
    var newStr = es6Template(devVersionTemplate, {
        version: pkg.version,
        timestamp: timestamp,
        revision: revision
    });
    return newStr;
};

/**
 * Publishes the module to npm using the current version number in pacakge.json.
 * If isTest is specified, it will instead create a tarball in the local directory.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param options {Object} - e.g. {"pack": "npm pack", "publish": "npm publish"}
 */
publish.pubImpl = function (isTest, options) {
    if (isTest) {
        // create a local tarball
        var packCmd = options.pack || defaults.pack;
        publish.execSync(packCmd);
    } else {
        // publish to npm
        var pubCmd = options.publish || defaults.publish;
        publish.execSync(pubCmd);
    }
};

/**
 * Tags the specified version with the specified dist-tag
 * If it is a test run, the tag command will be output to the console.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param version {String} - a string idicating which version to tag
 * @param tag {String} - the dist-tag to apply
 * @param options {Object} - e.g. {"distTag": "npm dist-tag add infusion@${version} ${tag}"}
 */
publish.tag = function (isTest, version, tag, options) {
    var cmdTemplate = options.distTag || defaults.distTag;
    var cmdStr = es6Template(cmdTemplate, {
        version: version,
        tag: tag
    });
    if (isTest) {
        console.log("tag command: " + cmdStr);
    } else {
        publish.execSync(cmdStr);
    }
};

/**
 * Resets the current workspace.
 * This will clear out any git tracked changes.
 *
 * Used internally to reset version number changes in package.json
 * @param options {Object} - e.g. {"clean": "git reset HEAD --hard"}
 */
publish.clean = function (options) {
    var cmdStr = options.clean || defaults.clean;
    publish.execSync(cmdStr);
};

/**
 * Publishes a develpment build.
 * This creates a release named after the version but with the build stamp,
 * appended to the end in the format X.x.x-prerelease.yyyymmddThhmmssZ.shortHash
 *
 * @param isTest {Boolean} - indicates if this is a test run
 * @param options {Object} - see defaultOptions in package.json for possible values
 */
publish.dev = function (isTest, options) {
    var opts = publish.shallowMerge({}, defaults, options);

    // Ensure no uncommitted changes
    publish.checkChanges(opts);

    var devVersion = publish.getDevVersion(opts);

    // set the version number
    publish.setVersion(devVersion, opts);

    publish.pubImpl(isTest, opts);
    publish.tag(isTest, devVersion, opts.devTag, opts);

    // cleanup changes
    publish.clean(opts);
};

/**
 * Publishes a release build.
 * This creates a release naved after the version in the package.json file.
 * It will not increase the version number, this must be done separately.
 *
 * @param isTest {Boolean} - indicates if this is a test run
 * @param options {Object} - see defaultOptions in package.json for possible values
 */
publish.release = function (isTest, options) {
    var opts = publish.shallowMerge({}, defaults, options);

    // Ensure no uncommitted changes
    publish.checkChanges(opts);

    publish.pubImpl(isTest, opts);
};

module.exports = publish;

if (require.main === module) {

    var opts = publish.getCLIOpts();
    var isTest = opts["--test"];
    var options = JSON.parse(opts["--options"] || "{}");

    if (opts["--dev"]) {
        publish.dev(isTest, options);
    } else {
        publish.release(isTest, options);
    }

}
