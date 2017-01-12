/*
Copyright 2015-2016 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/
/* eslint-env node */

"use strict";

var path = require("path");
var publish = require("../publish.js");
var assert = require("assert");
var sinon = require("sinon");

var createStubs = function (obj, methods) {
    var stubs = {};
    methods.forEach(function (method) {
        stubs[method] = sinon.stub(obj, method);
    });
    return stubs;
};

var resetStubs = function (obj, methods) {
    methods.forEach(function (method) {
        obj[method].reset();
    });
};

var removeStubs = function (obj, methods) {
    methods.forEach(function (method) {
        obj[method].restore();
    });
};

/******************
 * publish.getPkg *
 ******************/
console.log("\n*** publish.getPkg ***");

var getPkgFixture = [{
    moduleRoot: __dirname,
    expected: {
        name: "fluid-publish-test",
        version: "0.0.0"
    }
}];

getPkgFixture.forEach(function (fixture) {
    console.log("getPkg test - moduleRoot: " + fixture.moduleRoot);

    var result = publish.getPkg(fixture.moduleRoot);

    assert.deepEqual(result, fixture.expected, "Expected pkg: " + JSON.stringify(fixture.expected) + " actual: " + JSON.stringify(result));
});

/********************
 * publish.padZeros *
 ********************/
console.log("\n*** publish.padZeros ***");

var padZerosFixture = {
    nums: [0, 1, 10, "1"],
    widths: [1, 2],
    expected: [
        ["0", "00"], // num === 0
        ["1", "01"], // num === 1
        ["10", "10"], // num === 10
        ["1", "01"] // num === "1"
    ]
};

padZerosFixture.nums.forEach(function (num, numIdx) {
    padZerosFixture.widths.forEach(function (width, widthIdx) {
        console.log("padZeros test - num: " + num + " width: " + width);

        var result = publish.padZeros(num, width);
        var expected = padZerosFixture.expected[numIdx][widthIdx];

        assert.strictEqual(result, expected, "Expected string representation with required left padding: " + expected + " actual: " + result);
    });
});

/*************************
 * publish.fromTimestamp *
 *************************/
console.log("\n*** publish.fromTimestamp ***");

var fromTimestampFixture = [{
    timestamp: 1444914743,
    expected: {
        year: 2015,
        month: 10,
        day: 15,
        hours: 13,
        minutes: 12,
        seconds: 23
    }
}];

fromTimestampFixture.forEach(function (fixture) {
    console.log("fromTimestamp test - timestamp: " + fixture.timestamp);

    var result = publish.fromTimestamp(fixture.timestamp);
    assert.deepEqual(result, fixture.expected, "Expected adjusted date object: " + JSON.stringify(fixture.expected) + " actual: " + JSON.stringify(result));
});

/****************************
 * publish.convertToISO8601 *
 ****************************/
console.log("\n*** publish.convertToISO8601 ***");

var convertToISO6801Fixture = [{
    timestamp: 1444914743,
    expected: "20151015T131223Z"
}];

convertToISO6801Fixture.forEach(function (fixture) {
    console.log("convertToISO8601 test - timestamp: " + fixture.timestamp);

    var result = publish.convertToISO8601(fixture.timestamp);
    assert.equal(result, fixture.expected, "Expected ISO8601 timestamp: " + fixture.expected + " actual: " + result);
});

/********************************
 * publish.execSyncFromTemplate *
 ********************************/
console.log("\n*** publish.execSyncFromTemplate ***");

var execSyncFromTemplateFixture = [{
    template: "${value1}",
    values: {
        value1: "value one"
    },
    hint: "hint for single token template",
    expectedHint: "Hint: hint for single token template",
    expected: "value one",
    expectedLog: "Executing Command: value one"
}, {
    template: "${value1} and ${value2}",
    values: {
        value1: "value one",
        value2: "value two"
    },
    hint: "hint for multi-token template",
    expectedHint: "Hint: hint for multi-token template",
    expected: "value one and value two",
    expectedLog: "Executing Command: value one and value two"
}, {
    template: "${value1} to ${value2} and back to ${value1}",
    values: {
        value1: "value one",
        value2: "value two"
    },
    hint: "hint for reused token template",
    expectedHint: "Hint: hint for reused token template",
    expected: "value one to value two and back to value one",
    expectedLog: "Executing Command: value one to value two and back to value one"
}, {
    template: "no value",
    values: {
        value1: "value one",
        value2: "value two"
    },
    hint: "hint for no value test",
    expectedHint: "Hint: hint for no value test",
    expected: "no value",
    expectedLog: "Executing Command: no value"
}, {
    template: "$ {noToken}",
    values: {
        noToken: "no token"
    },
    hint: "hint for no token test",
    expectedHint: "Hint: hint for no token test",
    expected: "$ {noToken}",
    expectedLog: "Executing Command: $ {noToken}"
}];

execSyncFromTemplateFixture.forEach(function (fixture) {
    var toStub = ["execSync", "log"];
    var stub = createStubs(publish, toStub);


    console.log("execSyncFromTemplate test - template: " + fixture.template + " values: " + JSON.stringify(fixture.values) + " isTest: " + false);

    publish.execSyncFromTemplate(fixture.template, fixture.values, fixture.hint);
    assert(stub.execSync.called, "execSync should have been called");
    assert(stub.execSync.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);
    assert(stub.log.calledOnce, "log should have been called only once");
    assert.equal(stub.log.args[0][0], fixture.expectedLog, "log should have been called with: " + fixture.expectedLog);
    resetStubs(publish, toStub);

    console.log("execSyncFromTemplate test with exception - template: " + fixture.template + " values: " + JSON.stringify(fixture.values) + " isTest: " + false);

    stub.execSync["throws"]("Error message");
    assert["throws"](function () {publish.execSyncFromTemplate(fixture.template, fixture.values, fixture.hint);}, Error);
    assert(stub.execSync.called, "execSync should have been called");
    assert(stub.execSync.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);
    assert(stub.log.calledTwice, "log should have been called twice");
    assert.equal(stub.log.args[0][0], fixture.expectedLog, "log should have been called with: " + fixture.expectedLog);
    assert.equal(stub.log.args[1][0], fixture.expectedHint, "log should have been called with: " + fixture.expectedHint);
    resetStubs(publish, toStub);

    console.log("execSyncFromTemplate test - template: " + fixture.template + " values: " + JSON.stringify(fixture.values) + " isTest: " + true);

    publish.execSyncFromTemplate(fixture.template, fixture.values, fixture.hint, true);
    assert(stub.log.calledOnce, "log should have been called twice");
    assert.equal(stub.log.args[0][0], fixture.expectedLog, "log should have been called with: " + fixture.expectedLog);
    assert.equal(stub.execSync.callCount, 0, "execSync should not have been called");

    // removes stubs
    removeStubs(publish, toStub);
});

/************************
 * publish.checkChanges *
 ************************/
console.log("\n*** publish.checkChanges ***");

var checkChangesFixture = [{
    cmdStr: "test command string",
    cmdReturn: ""
}, {
    cmdStr: "test command string",
    cmdReturn: "some changes",
    errorMsg: "You have uncommitted changes\nsome changes",
    hint: "hint"
}];

checkChangesFixture.forEach(function (fixture) {
    console.log("checkChanges test - changes: " + fixture.cmdReturn);

    var toStub = ["execSync", "log"];
    var stub = createStubs(publish, toStub);
    stub.execSync.returns(fixture.cmdReturn);

    try {
        publish.checkChanges({changesCmd: fixture.cmdStr, changesHint: fixture.hint});
        assert(stub.execSync.called, "execSync should have been called");
        assert(stub.execSync.calledWith(fixture.cmdStr), "execSync should have been called with: " + fixture.cmdStr);

    } catch (e) {
        var expectedHint = "Hint: " + fixture.hint;
        assert(stub.log.calledWith(expectedHint), "log should have been called with: " + expectedHint);
        assert.equal(e.message, fixture.errorMsg, "The errorMsg should have been called correctly. expected: " + fixture.errorMsg + " actual: " + e.message);
    }

    removeStubs(publish, toStub);
});


/**********************
 * publish.setVersion *
 **********************/
console.log("\n*** publish.setVersion ***");

var setVersionFixture = [{
    version: "1.0.0",
    versionCmd: "set version: ${version}",
    expected: "set version: 1.0.0"
}];

setVersionFixture.forEach(function (fixture) {
    console.log("setVersion test - version: " + fixture.version + " versionCmd: " + fixture.versionCmd);

    var exec = sinon.stub(publish, "execSync");

    publish.setVersion(fixture.version, fixture);
    assert(exec.called, "execSync should have been called");
    assert(exec.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);

    // remove execSync stub
    publish.execSync.restore();
});

/*************************
 * publish.getDevVersion *
 *************************/
console.log("\n*** publish.getDevVersion ***");

var getDevVersionFixture = [{
    rawTimestampCmd: "get raw timestamp",
    revisionCmd: "get revision",
    devVersion: "${version}-${preRelease}.${timestamp}.${revision}",
    devTag: "test",
    moduleVersion: "1.2.3",
    expectedVersion: "1.2.3-test.20151015T131223Z.039d221",
    returnedTimestamp: 1444914743,
    returnedRevision: "039d221"
}];

getDevVersionFixture.forEach(function (fixture) {
    console.log("getDevVersion test - rawTimestampCmd: " + fixture.rawTimestampCmd + " revisionCmd: " + fixture.revisionCmd + " devVersion: " + fixture.devVersion);

    var exec = sinon.stub(publish, "execSync");
    exec.onFirstCall().returns(fixture.returnedTimestamp);
    exec.onSecondCall().returns(fixture.returnedRevision);

    var result = publish.getDevVersion(fixture.moduleVersion, fixture);

    assert(exec.calledTwice, "execSync should have been called twice");
    assert(exec.calledWith(fixture.rawTimestampCmd), "first execSync should have been called with: " + fixture.rawTimestampCmd);
    assert(exec.calledWith(fixture.revisionCmd), "second execSync should have been called with: " + fixture.revisionCmd);
    assert.equal(result, fixture.expectedVersion, "Expected version: " + fixture.expectedVersion + " actual: " + result);

    // remove execSync stub
    publish.execSync.restore();
});

/*******************
 * publish.pubImpl *
 *******************/
console.log("\n*** publish.pubImpl ***");

// In the cases where commands should not execute,
// their entry in the structure has been filled with a
// placeholder string beginning with "shouldn't"
var pubImplFixture = [{
    isTest: true,
    isDev: false,
    packCmd: "pack",
    publishCmd: "shouldn't publish",
    publishDevCmd: "shouldn't publish dev"
}, {
    isTest: false,
    isDev: false,
    packCmd: "shouldn't pack",
    publishCmd: "publish",
    publishDevCmd: "shouldn't publish dev"
}, {
    isDev: false,
    packCmd: "shouldn't pack",
    publishCmd: "publish",
    publishDevCmd: "shouldn't publish dev"
}, {
    isDev: true,
    packCmd: "shouldn't pack",
    publishCmd: "shouldn't publish",
    publishDevCmd: "publish dev"
}, {
    isTest: false,
    isDev: true,
    packCmd: "pack",
    publishCmd: "shouldn't publish",
    publishDevCmd: "publish dev"
}, {
    isTest: true,
    isDev: true,
    packCmd: "pack",
    publishCmd: "shouldn't publish",
    publishDevCmd: "shouldn't publish dev"
}, {
    isTest: false,
    packCmd: "shouldn't pack",
    publishCmd: "publish",
    publishDevCmd: "shouldn't publish dev"
}, {
    isTest: true,
    packCmd: "pack",
    publishCmd: "shouldn't publish",
    publishDevCmd: "shouldn't publish dev"
}, {
    packCmd: "shouldn't pack",
    publishCmd: "publish",
    publishDevCmd: "shouldn't publish dev"
}];

pubImplFixture.forEach(function (fixture) {
    console.log("pubImpl test - isTest: " + fixture.isTest + "isDev: " + fixture.isDev + " packCmd: " + fixture.packCmd + " publishCmd: " + fixture.publishCmd + " publishDevCmd: " + fixture.publishDevCmd);

    var exec = sinon.stub(publish, "execSync");
    var expected = fixture.isTest ? fixture.packCmd : fixture[fixture.isDev ? "publishDevCmd" : "publishCmd"];

    publish.pubImpl(fixture.isTest, fixture.isDev, fixture);
    assert(exec.calledOnce, "execSync should have been called");
    assert(exec.calledWith(expected), "execSync should have been called with: " + expected);

    // remove execSync stub
    publish.execSync.restore();
});

/*****************
 * publish.clean *
 *****************/
console.log("\n*** publish.clean ***");

var cleanFixture = [{
    moduleRoot: "./",
    cleanCmd: "clean"
}];

cleanFixture.forEach(function (fixture) {
    console.log("clean test - cleanCmd: " + fixture.cleanCmd);

    var exec = sinon.stub(publish, "execSync");

    publish.clean(fixture.moduleRoot, fixture);

    assert(exec.calledOnce, "execSync should have been called");
    assert(exec.calledWith(fixture.cleanCmd), "execSync should have been called with: " + fixture.expected);

    // remove execSync stub
    publish.execSync.restore();
});

/********************************
 * publish.getPublishPkgVersion *
 ********************************/
console.log("\n*** publish.getPublishPkgVersion ***");

var getPublishPkgVersionFixture = [{
    packageJson: {
        name: "test-package",
        version: "1.0.0"
    },
    expectedLog: "test-package 1.0.0"
}];

getPublishPkgVersionFixture.forEach(function (fixture) {
    console.log("getPublishPkgVersion test - version: " + fixture.expectedLog);

    var toStub = ["getPkg", "log"];
    var stub = createStubs(publish, toStub);

    stub.getPkg.returns(fixture.packageJson);

    var version = publish.getPublishPkgVersion();
    assert.equal(version, fixture.packageJson.version, "The version number " + fixture.packageJson.version + " should have been returned");
    assert(stub.log.calledOnce, "publish.log should have been called once");
    assert(stub.log.calledWith(fixture.expectedLog), "publish.log should have been called with: " + fixture.expectedLog);

    // remove stubs
    removeStubs(publish, toStub);
});


/*****************
 * publish tests *
 *****************/

var publishFixture = [{
    isTest: true,
    options: {
        "changesCmd": "dry run get changes",
        "checkRemoteCmd": "dry run check remote",
        "rawTimestampCmd": "dry run get rawTimestamp",
        "revisionCmd": "dry run get revision",
        "packCmd": "dry run pack",
        "publishCmd": "dry run publish",
        "publishDevCmd": "dry run npm publish dev",
        "versionCmd": "dry run version",
        "cleanCmd": "dry run clean",
        "vcTagCmd": "dry run vc tag",
        "pushVCTagCmd": "dry run push vc tag",
        "devVersion": "dry run ${version}-${preRelease}.${timestamp}.${revision}",
        "devTag": "dry run dev",
        "remoteName": "dry run remote",
        "moduleRoot": __dirname,
        "changesHint": "dry run changes hint\n",
        "checkRemoteHint": "dry run check remote hint\n",
        "publishHint": "dry run publish hint\n",
        "publishDevHint": "dry run publish dev hint\n",
        "vcTagHint": "dry run vc tag hint\n",
        "pushVCTagHint": "dry run push vc tag hint\n"
    }
}, {
    isTest: false,
    options: {
        "changesCmd": "get changes",
        "checkRemoteCmd": "check remote",
        "rawTimestampCmd": "get rawTimestamp",
        "revisionCmd": "get revision",
        "packCmd": "pack",
        "publishCmd": "publish",
        "publishDevCmd": "publish dev",
        "versionCmd": "version",
        "cleanCmd": "clean",
        "vcTagCmd": "vc tag",
        "pushVCTagCmd": "push vc tag",
        "devVersion": "${version}-${preRelease}.${timestamp}.${revision}",
        "devTag": "dev",
        "remoteName": "remote",
        "moduleRoot": __dirname,
        "changesHint": "changes hint\n",
        "checkRemoteHint": "check remote hint\n",
        "publishHint": "publish hint\n",
        "publishDevHint": "publish dev hint\n",
        "vcTagHint": "vc tag hint\n",
        "pushVCTagHint": "push vc tag hint\n"
    }
}];

/***************
 * publish.dev *
 ***************/
console.log("\n*** publish.dev ***");

publishFixture.forEach(function (fixture) {
    var modulePackagePath = path.join(fixture.options.moduleRoot, "package.json");
    var modulePackage = require(modulePackagePath);
    var optsString = JSON.stringify(fixture.options || {});
    console.log("dev test - isTest: " + fixture.isTest, " options: " + optsString + "\n");

    var toStub = ["checkChanges", "getDevVersion", "setVersion", "pubImpl", "clean"];
    var stub = createStubs(publish, toStub);
    var moduleVersion = modulePackage.version;
    var devVersion = moduleVersion + "-testVersion";

    stub.getDevVersion.returns(devVersion);

    publish.dev(fixture.isTest, fixture.options);

    assert(stub.checkChanges.calledOnce, "checkChanges should have been called");
    assert(stub.getDevVersion.calledOnce, "getDevVersion should have been called");
    assert(stub.getDevVersion.calledWith(moduleVersion, fixture.options), "getDevVersion should have been called with:" + moduleVersion + ", " + optsString);
    assert(stub.setVersion.calledOnce, "setVersion should have been called");
    assert(stub.setVersion.calledWith(devVersion, fixture.options), "setVersion should have been called with: " + devVersion + ", " + optsString);
    assert(stub.pubImpl.calledOnce, "pubImpl should have been called");
    assert(stub.pubImpl.calledWith(fixture.isTest, true, fixture.options), modulePackage);
    assert(stub.clean.calledOnce, "clean should have been called");
    assert(stub.clean.calledWith(fixture.options.moduleRoot, fixture.options), "clean should have been called with: " + fixture.options.moduleRoot + ", true, " + optsString);

    removeStubs(publish, toStub);
});

/********************
 * publish.standard *
 ********************/
console.log("\n*** publish.standard ***");

publishFixture.forEach(function (fixture) {
    var modulePackagePath = path.join(fixture.options.moduleRoot, "package.json");
    var modulePackage = require(modulePackagePath);
    var optsString = JSON.stringify(fixture.options || {});
    console.log("release test - isTest: " + fixture.isTest, " options: " + optsString + "\n");

    var toStub = ["checkChanges", "checkRemote", "tagVC", "pubImpl"];
    var stub = createStubs(publish, toStub);

    publish.standard(fixture.isTest, fixture.options);

    assert(stub.checkChanges.calledOnce, "checkChanges should have been called");
    assert(stub.checkRemote.calledOnce, "checkRemote should have been called");
    assert(stub.checkRemote.calledWith(fixture.options), "checkRemote should have been called with: " + optsString);
    assert(stub.tagVC.calledOnce, "tagVC should have been called");
    assert(stub.tagVC.calledWith(fixture.isTest, modulePackage.version, fixture.options), "tagVC should have been called with: " + fixture.isTest + " ," + modulePackage.version + " ," + optsString);
    assert(stub.pubImpl.calledOnce, "pubImpl should have been called");
    assert(stub.pubImpl.calledWith(fixture.isTest, false, fixture.options), "pubImpl should have been called with: " + fixture.isTest + ", false, " + optsString);

    removeStubs(publish, toStub);
});
