#! /usr/bin/env node

/*
Copyright 2015-2016 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

/* eslint-env node */

"use strict";

var publish = {};
var path = require("path");
var extend = require("extend");

// Using the es6-template-strings module instead of the native ES6 Template Literals
// because Template Literals require the template to be surrounded in "`", which are not
// accepted as valid JSON ( the defaults are stored in the package.json file ).
var es6Template = require("es6-template-strings");

// execSync  and log are added to the exported "publish" namespace so they can
// be stubbed in the tests.
publish.execSync = require("child_process").execSync;
publish.log = console.log;



/**
 * Returns the contents of a package.json file as JSON object
 *
 * @param moduleRoot {String} - the path to the root where the package.json is
 *                              located. Will use process.cwd() by default.
 * @returns {Object} - returns the contents of the package.json file as a JSON
 *                     object.
 */
publish.getPkg = function (moduleRoot) {
    moduleRoot = moduleRoot || process.cwd();
    var modulePkgPath = path.join(moduleRoot, "package.json");
    return require(modulePkgPath);
};

/**
 * Processes the argv command line arguments into an object
 * Options are expected to be key/value pairs in the format of `key=value`.
 * When only a key is provided, that is no "=" symbol is found, the value
 * is set to true.
 *
 * see: https://nodejs.org/docs/latest/api/process.html#process_process_argv
 *
 * @returns {Object} - the CLI arguments as an options object
 */
publish.getCLIOpts = function () {
    var opts = {};

    process.argv.forEach(function (val, index) {
        if (index > 1) {
            var opt = val.split("=");

            // convert "true" and "false" to the respective boolean value
            if (opt[1] === "false") {
                opt[1] = false;
            } else if (opt[1] === "true") {
                opt[1] = true;
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
 * Calls publish.execSync with a command crafted from a template string.
 * If it is a test run, the command will only be logged to the console.
 *
 * @param cmdTemplate {String} - A string template of the command to execute.
 *                               Can provide tokens in the form ${tokenName}
 * @param values {Object} - the tokens and their replacement.
 *                          e.g. {tokenName: "value to insert"}
 * @param hint {String} - A string template of a hint for recovering from an error thrown by the executed command.
 *                               Can provide tokens in the form ${tokenName}
 * @param isTest {Boolean} - indicates if this is a test run or not. If it is
 *                           a test run, the command will be logged but not executed.
 */
publish.execSyncFromTemplate = function (cmdTemplate, cmdValues, hint, isTest) {
    var cmdStr = es6Template(cmdTemplate, cmdValues);
    publish.log("Executing Command: " + cmdStr);

    if (!isTest) {
        try {
            return publish.execSync(cmdStr);
        } catch (error) {
            var hintStr = es6Template(hint, cmdValues);
            publish.log("Hint: " + hintStr);
            throw (error);
        }
    }
};

/**
 * Throws an error if there are any uncommitted changes
 *
 * @param options {Object} - e.g. {"changesCmd": "git status -s -uno", "changesHint": "change hint"}
 * @throws Error - An error object with a message containing a list of uncommitted changes.
 */
publish.checkChanges = function (options) {
    var changes = publish.execSyncFromTemplate(options.changesCmd);

    if (changes.length) {
        publish.log("Hint: " + options.changesHint);
        throw new Error("You have uncommitted changes\n" + changes);
    }
};

/**
 * Checks that the remote exists. If it does not exist an error is thrown.
 *
 * @param options {Object} - e.g. {"checkRemoteCmd": "git ls-remote --exit-code ${remote}", "remoteName": "upstream", "checkRemoteHint": "check remote hint"}
 */
publish.checkRemote = function (options) {
    publish.execSyncFromTemplate(options.checkRemoteCmd, {
        remote: options.remoteName
    }, options.checkRemoteHint);
};

/**
 * Updates the package.json version to the specified version
 * This does not commit the change, it will only modify the file.
 *
 * @param version {String} - the version to set in the package.json file
 * @param options {Object} - e.g. {"versionCmd": "npm version --no-git-tag-version ${version}"}
 */
publish.setVersion = function (version, options) {
    publish.execSyncFromTemplate(options.versionCmd, {
        version: version
    });
};

/**
 * Calculates the current dev version of the package.
 * Will include dev version name if run on a branch other than master, or if
 * the devName option is provided.
 *
 * @param moduleVersion {String} - The version of the module (e.g. X.x.x)
 * @param options {Object} - e.g. {"rawTimestampCmd": "git show -s --format=%ct HEAD", "revisionCmd": "git rev-parse --verify --short HEAD", "branchCmd": "git rev-parse --abbrev-ref HEAD", "devVersion": "${version}-${preRelease}.${timestamp}.${revision}", "devName": "", "devTag": "dev"}
 * @returns {String} - the current dev version number
 */
publish.getDevVersion = function (moduleVersion, options) {
    var rawTimestamp = publish.execSyncFromTemplate(options.rawTimestampCmd);
    var timestamp = publish.convertToISO8601(rawTimestamp);
    var revision = publish.execSyncFromTemplate(options.revisionCmd).toString().trim();
    var branch = publish.execSyncFromTemplate(options.branchCmd).toString().trim();

    var newStr = es6Template(options.devVersion, {
        version: moduleVersion,
        preRelease: options.devTag,
        timestamp: timestamp,
        revision: revision
    });

    if (branch !== "master" || options.devName) {
        newStr = newStr + "." + (options.devName || branch);
    }

    return newStr;
};

/**
 * Publishes the module to npm using the current version number in pacakge.json.
 * If isTest is specified, it will instead create a tarball in the local directory.
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param isDev {Boolean} - indicates if this is a development (true) or standard (false) release
 * @param options {Object} - e.g. {"packCmd": "npm pack", "publishCmd": "npm publish", "publishDevCmd": "npm publish --tag", "publishHint": "publish hint", "publishDevHint": "publish dev hint", devTag: "dev"}
 */
publish.pubImpl = function (isTest, isDev, options) {
    if (isTest) {
        // create a local tarball
        publish.execSyncFromTemplate(options.packCmd);
    } else {
        // publish to npm
        var pubCmd = isDev ? options.publishDevCmd : options.publishCmd;
        var pubHint = isDev ? options.publishDevHint : options.publishHint;
        publish.execSyncFromTemplate(pubCmd, options, pubHint);
    }
};

/**
 * Applies a version control tag to the latest commit
 *
 * @param isTest {Boolean} - indicates if this is a test run or not
 * @param version {String} - a string indicating the version
 * @param options {Object} - e.g. {"vcTagCmd": "git tag -a v${version} -m 'Tagging the ${version} release'", "pushVCTagCmd": "git push ${remote} v${version}", "remoteName": "upstream", "vcTagHint": "vc tag hint", "pushVCTagHint": "push vc tag hint"}
 */
publish.tagVC = function (isTest, version, options) {
    publish.execSyncFromTemplate(options.vcTagCmd, {
        version: version,
        remote: options.remoteName
    }, options.vcTagHint, isTest);

    publish.execSyncFromTemplate(options.pushVCTagCmd, {
        version: version,
        remote: options.remoteName
    }, options.pushVCTagHint, isTest);
};

/**
 * Restore the package.json file to the latest committed version.
 *
 * Used internally to reset version number changes in package.json
 * @param moduleRoot {String} - the directory where the package.json file to
                                clean is located in.
 * @param options {Object} - e.g. {"cleanCmd": "git checkout -- package.json"}
 */
publish.clean = function (moduleRoot, options) {
    var originalDir = process.cwd();

    // change to the module root directory
    process.chdir(moduleRoot || "./");

    // run the clean command
    publish.execSyncFromTemplate(options.cleanCmd);

    // restore the working directory
    process.chdir(originalDir);
};

publish.getPublishPkgVersion = function () {
    var publishPkg = publish.getPkg(__dirname);
    publish.log(publishPkg.name + " " + publishPkg.version);
    return publishPkg.version;
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
    var publishPkg = publish.getPkg(__dirname);
    var opts = extend(true, {}, publishPkg.defaultOptions, options);

    // The package.json file of the top level package which is
    // running this module.
    var modulePkg = publish.getPkg(opts.moduleRoot);

    var checkChange = options.checkChanges;
    if (checkChange === undefined) {
        checkChange = true;
    }

    // Ensure no uncommitted changes
    if (checkChange) {
        publish.checkChanges(opts);
    }

    var devVersion = publish.getDevVersion(modulePkg.version, opts);

    // set the version number
    publish.setVersion(devVersion, opts);

    try {
        // publish
        publish.pubImpl(isTest, true, opts);
    } finally {
        // cleanup changes
        publish.clean(opts.moduleRoot, opts);
    };

};

/**
 * Publishes a standard release build.
 * This creates a release named after the version in the package.json file.
 * It will not increase the version number, this must be done separately.
 * However, it will create a tag and publish this tag to the version control
 * system.
 *
 * @param isTest {Boolean} - indicates if this is a test run
 * @param options {Object} - see defaultOptions in package.json for possible values
 */
publish.standard = function (isTest, options) {
    var publishPkg = publish.getPkg(__dirname);
    var opts = extend(true, {}, publishPkg.defaultOptions, options);

    // The package.json file of the top level package which is
    // running this module.
    var modulePkg = publish.getPkg(opts.moduleRoot);

    var checkChange = options.checkChanges;
    if (checkChange === undefined) {
        checkChange = true;
    }

    // Ensure no uncommitted changes
    if (checkChange) {
       publish.checkChanges(opts);
    }

    // Ensure that the specified remote repository exists
    publish.checkRemote(opts);

    // create version control tag
    publish.tagVC (isTest, modulePkg.version, opts);

    // publish
    publish.pubImpl(isTest, false, opts);
};

module.exports = publish;

if (require.main === module) {

    var opts = publish.getCLIOpts();
    var isTest = opts["--test"];

    if (opts["--version"]) {
        publish.getPublishPkgVersion();
    } else if (opts["--standard"]) {
        publish.standard(isTest, opts);
    } else {
        publish.dev(isTest, opts);
    }

}
