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

/**
 * Throws an error if there are any uncommitted changes
 */
publish.checkChanges = function () {
    if (publish.gitChanges.length) {
        throw new Error("You have uncommitted changes\n" + publish.gitChanges);
    }
};

/**
 * Updates the package.json version to the current dev release version
 * This does not commit the change, it will only modify the file.
 */
publish.setDevVersion = function () {
    execSync("npm version --no-git-tag-version " + publish.devVersion);
};

/**
 * Publishes the module to npm using the current version number in pacakge.json.
 * If isTest is specified, it will instead create a tarball in the local directory.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 */
publish.pubImpl = function (isTest) {
    if (isTest) {
        // create a local tarball
        execSync("npm pack");
    } else {
        // publish to npm
        execSync("npm publish");
    }
};

/**
 * Tags the specified version with the specified dist-tag
 * If it is a test run, the tag command will be output to the console.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param version {String} - a string idicating which version to tag
 * @param tag {String} - the dist-tag to apply
 */
publish.tag = function (isTest, version, tag) {
    if (isTest) {
        console.log("npm dist-tag add infusion@" + version + " " + tag);
    } else {
        execSync("npm dist-tag add infusion@" + version + " " + tag);
    }
};

/**
 * Resets the current workspace.
 * This will clear out any git tracked changes.
 *
 * Used internally to reset version number changes in package.json
 */
publish.clean = function () {
    execSync("git reset HEAD --hard");
};

/**
 * Publishes a develpment build.
 * This creates a release named after the version but with the build stamp,
 * appended to the end in the format X.x.x-prerelease.yyyymmddThhmmssZ.shortHash
 *
 * @param isTest {Boolean} - indicates if this is a test run
 */
publish.dev = function (isTest) {
    // Ensure no uncommitted changes
    publish.checkChanges();

    // set the version number
    publish.setDevVersion();

    publish.pubImpl(isTest);
    publish.tag(isTest, publish.devVersion, "dev");

    // cleanup changes
    publish.clean();
};

/**
 * Publishes a release build.
 * This creates a release naved after the version in the package.json file.
 * It will not increase the version number, this must be done separately.
 *
 * @param isTest {Boolean} - indicates if this is a test run
 */
publish.release = function (isTest) {
    // Ensure no uncommitted changes
    publish.checkChanges();

    publish.pubImpl(isTest);
};

module.exports = publish.publish;

if (require.main === module) {

    var opts = publish.getCLIOpts();
    var isTest = opts["--test"] || true;

    if (opts["--dev"]) {
        publish.dev(isTest);
    } else {
        publish.release(isTest);
    }

}
