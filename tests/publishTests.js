/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

"use strict";

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

var removeStubs = function (obj, methods) {
    methods.forEach(function (method) {
        obj[method].restore();
    });
};

// publish.padZeros
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

// publish.fromTimestamp
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

// publish.convertToISO8601
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

// publish.checkChanges
console.log("\n*** publish.checkChanges ***");

var checkChangesFixture = [{
    cmdStr: "test command string",
    cmdReturn: ""
}, {
    cmdStr: "test command string",
    cmdReturn: "some changes",
    errorMsg: "You have uncommitted changes\nsome changes"
}];

checkChangesFixture.forEach(function (fixture) {
    console.log("checkChanges test - changes: " + fixture.cmdReturn);

    var exec = sinon.stub(publish, "execSync");
    exec.returns(fixture.cmdReturn);

    try {
        publish.checkChanges({changes: fixture.cmdStr});
        assert(exec.called, "execSync should have been called");
        assert(exec.calledWith(fixture.cmdStr), "execSync should have been called with: " + fixture.cmdStr);

    } catch (e) {
        assert.equal(e.message, fixture.errorMsg, "The errorMsg should have been called correctly. expected: " + fixture.errorMsg + " actual: " + e.message);
    }

    // remove execSync stub
    publish.execSync.restore();
});

// publish.setVersion
console.log("\n*** publish.setVersion ***");

var setVersionFixture = [{
    version: "1.0.0",
    cmdStr: "set version: ${version}",
    expected: "set version: 1.0.0"
}];

setVersionFixture.forEach(function (fixture) {
    console.log("setVersion test - version: " + fixture.version + " cmdStr: " + fixture.cmdStr);

    var exec = sinon.stub(publish, "execSync");

    publish.setVersion(fixture.version, {version: fixture.cmdStr});
    assert(exec.called, "execSync should have been called");
    assert(exec.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);

    // remove execSync stub
    publish.execSync.restore();
});

// publish.getDevVersion
console.log("\n*** publish.getDevVersion ***");

var getDevVersionFixture = [{
    rawTimestamp: "get raw timestamp",
    revision: "get revision",
    devVersion: "${timestamp}.${revision}",
    expectedVersion: "20151015T131223Z.039d221",
    returnedTimestamp: 1444914743,
    returnedRevision: "039d221"
}];

getDevVersionFixture.forEach(function (fixture) {
    console.log("getDevVersion test - rawTimestamp: " + fixture.rawTimestamp + " revision: " + fixture.revision + " devVersion: " + fixture.devVersion);

    var exec = sinon.stub(publish, "execSync");
    exec.onFirstCall().returns(fixture.returnedTimestamp);
    exec.onSecondCall().returns(fixture.returnedRevision);

    var result = publish.getDevVersion(fixture);

    assert(exec.calledTwice, "execSync should have been called twice");
    assert(exec.calledWith(fixture.rawTimestamp), "first execSync should have been called with: " + fixture.rawTimestamp);
    assert(exec.calledWith(fixture.revision), "second execSync should have been called with: " + fixture.revision);
    assert.equal(result, fixture.expectedVersion, "Expected version: " + fixture.expectedVersion + " actual: " + result);

    // remove execSync stub
    publish.execSync.restore();
});

// publish.pubImpl
console.log("\n*** publish.pubImpl ***");

var pubImplFixture = [{
    isTest: true,
    pack: "pack",
    publish: "shouldn't publish"
}, {
    isTest: false,
    pack: "shouldn't pack",
    publish: "publish"
}, {
    pack: "shouldn't pack",
    publish: "publish"
}];

pubImplFixture.forEach(function (fixture) {
    console.log("pubImpl test - isTest: " + fixture.isTest + " pack: " + fixture.pack + " publish: " + fixture.publish);

    var exec = sinon.stub(publish, "execSync");
    var expected = fixture[fixture.isTest ? "pack" : "publish"];

    publish.pubImpl(fixture.isTest, fixture);
    assert(exec.calledOnce, "execSync should have been called");
    assert(exec.calledWith(expected), "execSync should have been called with: " + expected);

    // remove execSync stub
    publish.execSync.restore();
});

// publish.tag
console.log("\n*** publish.tag ***");

var tagFixture = [{
    isTest: true,
    version: "1.0.0",
    tag: "tag",
    distTag: "add tag ${tag} to ${version}",
    expected: "tag command: add tag tag to 1.0.0"
}, {
    isTest: false,
    version: "2.0.0",
    tag: "tag2",
    distTag: "add tag ${tag} to ${version}",
    expected: "add tag tag2 to 2.0.0"
}, {
    version: "3.0.0",
    tag: "tag3",
    distTag: "add tag ${tag} to ${version}",
    expected: "add tag tag3 to 3.0.0"
}];

tagFixture.forEach(function (fixture) {
    console.log("tag test - isTest: " + fixture.isTest + " version: " + fixture.version + " tag: " + fixture.tag + " distTag: " + fixture.distTag);

    var exec = sinon.stub(publish, "execSync");
    var log = sinon.stub(console, "log");

    publish.tag(fixture.isTest, fixture.version, fixture.tag, fixture);

    if (fixture.isTest) {
        assert(log.calledOnce, "console.log should have been called");
        assert(log.calledWith(fixture.expected), "console.log should have been called with: " + fixture.expected);
        assert(!exec.called, "execSync should not have been called");
    } else {
        assert(exec.calledOnce, "execSync should have been called");
        assert(exec.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);
        assert(!log.called, "console.log should not have been called");
    }

    // remove execSync and log stubs
    publish.execSync.restore();
    console.log.restore();
});

// publish.clean
console.log("\n*** publish.clean ***");

var cleanFixture = [{
    clean: "clean command"
}];

cleanFixture.forEach(function (fixture) {
    console.log("clean test - clean: " + fixture.clean);

    var exec = sinon.stub(publish, "execSync");

    publish.clean(fixture);

    assert(exec.calledOnce, "execSync should have been called");
    assert(exec.calledWith(fixture.clean), "execSync should have been called with: " + fixture.clean);

    // remove execSync stub
    publish.execSync.restore();
});

// publish tests

var publishFixture = [{
    isTest: true,
    options: {
        "changes": "dry run get changes",
        "rawTimestamp": "dry run get rawTimestamp",
        "revision": "dry run get revision",
        "pack": "dry run pack",
        "publish": "dry run publish",
        "version": "dry run version",
        "distTag": "dry run set tag",
        "clean": "dry run clean",
        "devVersion": "dry run ${version}.${timestamp}.${revision}",
        "devTag": "dry run dev"
    }
}, {
    isTest: false,
    options: {
        "changes": "get changes",
        "rawTimestamp": "get rawTimestamp",
        "revision": "get revision",
        "pack": "pack",
        "publish": "publish",
        "version": "version",
        "distTag": "set tag",
        "clean": "clean",
        "devVersion": "${version}.${timestamp}.${revision}",
        "devTag": "dev"
    }
}];

// publish.dev
console.log("\n*** publish.dev ***");

publishFixture.forEach(function (fixture) {
    var optsString = JSON.stringify(fixture.options || {});
    console.log("dev test - isTest: " + fixture.isTest, " options: " + optsString + "\n");

    var toStub = ["checkChanges", "getDevVersion", "setVersion", "pubImpl", "tag", "clean"];
    var stub = createStubs(publish, toStub);
    var devVersion = "1.0.0-testVersion";
    stub.getDevVersion.returns(devVersion);

    publish.dev(fixture.isTest, fixture.options);

    assert(stub.checkChanges.calledOnce, "checkChanges should have been called");
    assert(stub.getDevVersion.calledOnce, "getDevVersion should have been called");
    assert(stub.getDevVersion.calledWith(fixture.options), "getDevVersion should have been called with: " + optsString);
    assert(stub.setVersion.calledOnce, "setVersion should have been called");
    assert(stub.setVersion.calledWith(devVersion, fixture.options), "setVersion should have been called with: " + devVersion + ", " + optsString);
    assert(stub.pubImpl.calledOnce, "pubImpl should have been called");
    assert(stub.pubImpl.calledWith(fixture.isTest, fixture.options), "pubImpl should have been called with: " + fixture.isTest + ", " + optsString);
    assert(stub.tag.calledOnce, "tag should have been called");
    assert(stub.tag.calledWith(fixture.isTest, devVersion, fixture.options.devTag, fixture.options), "tag should have been called with: " + fixture.isTest + ", " + devVersion + ", " + fixture.options.devTag + ", " + optsString);
    assert(stub.clean.calledOnce, "clean should have been called");
    assert(stub.clean.calledWith(fixture.options), "clean should have been called with: " + optsString);

    removeStubs(publish, toStub);
});

// publish.release
console.log("\n*** publish.release ***");

publishFixture.forEach(function (fixture) {
    var optsString = JSON.stringify(fixture.options || {});
    console.log("release test - isTest: " + fixture.isTest, " options: " + optsString + "\n");

    var toStub = ["checkChanges", "pubImpl"];
    var stub = createStubs(publish, toStub);

    publish.release(fixture.isTest, fixture.options);

    assert(stub.checkChanges.calledOnce, "checkChanges should have been called");
    assert(stub.pubImpl.calledOnce, "pubImpl should have been called");
    assert(stub.pubImpl.calledWith(fixture.isTest, fixture.options), "pubImpl should have been called with: " + fixture.isTest + ", " + optsString);

    removeStubs(publish, toStub);
});
