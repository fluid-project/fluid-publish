/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

// Declare dependencies
/* global module */

module.exports = function (grunt) {
    "use strict";

    // Project configuration.
    grunt.initConfig({
        // Project package file destination.
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            all: ["**/*.js"],
            buildScripts: ["Gruntfile.js"],
            options: {
                jshintrc: true
            }
        },
        jsonlint: {
            all: ["package.json", ".jshintrc"]
        }
    });

    // Load the plugin(s):
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jsonlint");

    // Custom tasks:

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Apply jshint and jsonlint", ["jshint", "jsonlint"]);
};
