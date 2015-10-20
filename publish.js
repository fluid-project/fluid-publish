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
var extend = require("extend");

// The package.json file of the top level package which is
// running this module.
var modulePkg = require(process.cwd() + "/package.json");

// execSync  and log are added to the exported "publish" namespace so they can
// be stubbed in the tests.
publish.execSync = require("child_process").execSync;
publish.log = console.log;

// TODO: The supported version of node.js does not yet support ES6 template strings
// When version node.js 4.x.x is supported this can be replaced by native support.
var es6Template = require("es6-template-strings");

var defaults = pkg.defaultOptions;

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
 * Creates a number with 0's padded on the left
 *
 * @param num {Number}
 * @param width {Number} - the min-width of the number (default is 2),
 *                        if the number is shorter it will be padded with zeros on the left.
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
 * Converts a git timestamp into a particular profile of ISO8601 timestamp,
 * with the format yyyymmddThhmmssZ
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
 * @param options {Object} - e.g. {"changesCmd": "git status -s -uno"}
 * @throws Error - An error object with a message containing a list of uncommitted changes.
 */
publish.checkChanges = function (options) {
    var cmdStr = options.changesCmd || defaults.changesCmd;
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
 * @param options {Object} - e.g. {"versionCmd": "npm version --no-git-tag-version ${version}"}
 */
publish.setVersion = function (version, options) {
    var cmdTemplate = options.versionCmd || defaults.versionCmd;
    var cmdStr = es6Template(cmdTemplate, {
        version: version
    });
    publish.execSync(cmdStr);
};

/**
 * Calculates the current dev version of the package
 *
 * @param options {Object} - e.g. {"rawTimestampCmd": "git show -s --format=%ct HEAD", "revisionCmd": "git rev-parse --verify --short HEAD", "devVersion": "${version}-${preRelease}.${timestamp}.${revision}", "devTag": "dev"}
 * @returns {String} - the current dev version number
 */
publish.getDevVersion = function (options) {
    var rawTimestamp = publish.execSync(options.rawTimestampCmd || defaults.rawTimestampCmd);
    var timestamp = publish.convertToISO8601(rawTimestamp);
    var revision = publish.execSync(options.revisionCmd || defaults.revisionCmd);
    var preRelease = options.devTag || defaults.devTag;
    var devVersionTemplate = options.devVersion || defaults.devVersion;
    var newStr = es6Template(devVersionTemplate, {
        version: pkg.version,
        preRelease: preRelease,
        timestamp: timestamp,
        revision: revision
    });
    return newStr;
};

/**
 * Retrieves the name of the executing module.
 *
 * @returns {String} - the name of the executing module, as sourced from its
 *                     package.json file.
 */
publish.getPackageName = function () {
    return modulePkg.name;
};

/**
 * Publishes the module to npm using the current version number in pacakge.json.
 * If isTest is specified, it will instead create a tarball in the local directory.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param options {Object} - e.g. {"packCmd": "npm pack", "publishCmd": "npm publish"}
 */
publish.pubImpl = function (isTest, options) {
    if (isTest) {
        // create a local tarball
        var packCmd = options.packCmd || defaults.packCmd;
        publish.execSync(packCmd);
    } else {
        // publish to npm
        var publishCmd = options.publishCmd || defaults.publishCmd;
        publish.execSync(publishCmd);
    }
};

/**
 * Tags the specified version with the specified dist-tag
 * If it is a test run, the tag command will be output to the console.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param version {String} - a string indicating which version to tag
 * @param tag {String} - the dist-tag to apply
 * @param options {Object} - e.g. "npm dist-tag add ${packageName}@${version} ${tag}"
 */
publish.tag = function (isTest, packageName, version, tag, options) {
    var cmdTemplate = options.distTagCmd || defaults.distTagCmd;
    var cmdStr = es6Template(cmdTemplate, {
        packageName: packageName,
        version: version,
        tag: tag
    });
    if (isTest) {
        publish.log("tag command: " + cmdStr);
    } else {
        publish.execSync(cmdStr);
    }
};

/**
 * Restore the package.json file to the latest committed version.
 *
 * Used internally to reset version number changes in package.json
 * @param options {Object} - e.g. {"cleanCmd": "git reset HEAD --hard"}
 */
publish.clean = function (options) {
    var cmdStr = options.cleanCmd || defaults.cleanCmd;
    publish.execSync(cmdStr);
};

/**
 * Publishes a development build.
 * This creates a release named after the version, but with the build stamp
 * appended to the end. By default this will create a release with version
 * X.x.x-prerelease.yyyymmddThhmmssZ.shortHash where X.x.x is sourced
 * from the version number in the package.json file, -pre-release is from the
 * devTag option (also applied as a tag to the release), and the build id
 * (yyyymmddThhmmssZ.shortHash) is generated based on the latest commit.
 *
 * @param isTest {Boolean} - indicates if this is a test run
 * @param options {Object} - see defaultOptions in package.json for possible values
 */
publish.dev = function (isTest, options) {
    var opts = extend(true, {}, defaults, options);

    // Ensure no uncommitted changes
    publish.checkChanges(opts);

    var devVersion = publish.getDevVersion(opts);
    var packageName = publish.getPackageName();

    // set the version number
    publish.setVersion(devVersion, opts);

    publish.pubImpl(isTest, opts);
    publish.tag(isTest, packageName, devVersion, opts.devTag, opts);

    // cleanup changes
    publish.clean(opts);
};

/**
 * Publishes a release build.
 * This creates a release named after the version in the package.json file.
 * It will not increase the version number, this must be done separately.
 *
 * @param isTest {Boolean} - indicates if this is a test run
 * @param options {Object} - see defaultOptions in package.json for possible values
 */
publish.release = function (isTest, options) {
    var opts = extend(true, {}, defaults, options);

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
