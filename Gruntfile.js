/*
Copyright 2015-2016 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

/* eslint-env node */
"use strict";

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        // Project package file destination.
        pkg: grunt.file.readJSON("package.json"),
        lintAll: {
            sources: {
                md: [ "**/*.md", "!node_modules/**/*.md"],
                js: ["**/*.js"],
                json: ["*.json", ".*.json", "tests/*.json", "!./package-lock.json"],
                other: ["./.*", "!node_modules/**/*.*", "!./**/.DS_Store", "!./package-lock.json"]
            }
        }
    });

    grunt.loadNpmTasks("gpii-grunt-lint-all");
    grunt.registerTask("lint", "Perform all standard lint checks.", ["lint-all"]);

    grunt.registerTask("default", ["lint"]);
};
