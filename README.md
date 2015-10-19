# publish #
A command line tool and node module that can be used to simplify the process of publishing a module to NPM. This is particularly useful for creating development releases, e.g. nightly or continuous integration releases.

## Usage ##

### Command Line ###

#### --dev ####

__value__: true (Boolean)

Specifies that a development release should be generated. By default this will create a release with version X.x.x-prerelease.yyyymmddThhmmssZ.shortHash where x.x.x-prerelease is sourced from the version number in the package.json file and the build identifier (yyyymmddThhmmssZ.shortHash) is generated based on the latest commit.

```bash
# creates a dev release
node publish.js --dev

# creates a regular releases
node publish.js
```

#### --test ####

__value__: true (Boolean)

Specifies that a tarball should be created instead of publishing to NPM. This is useful to use a means of testing that the publish will happen correctly.

```bash
# creates a tarball
node publish.js --test
node publish.js --test --dev

# publishes to NPM
node publish.js
node publish.js --dev
```

#### --options #####

__value__: {String} stringified JSON object

A stringified JSON object containing overrides to the default options used across the publish script. The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key.

(See: [Options](#options))

```bash
# publishes a dev build and applies the tag "nightly" to it
node publish.js --dev --options="{'devTag': 'nightly'}"
```

### Node ###

#### `release` ####

Publishes a release build. This creates a release named after the version in the package.json file. By default it will not increase the version number, this must be done separately.

```javascript
var publish = require("publish");
publish.release();
```

##### parameters #####

 * isTest {Boolean} - Indicates if this is a test run, if true a tarball will be generated instead of publishing to NPM.
 * options {Object} - The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key. (See: [Options](#options))

#### `dev` ####

Publishes a development build. This creates a release named after the version, but with the build stamp appended to the end. By default this will create a release with version X.x.x-prerelease.yyyymmddThhmmssZ.shortHash where x.x.x-prerelease is sourced from the version number in the package.json file and the build identifier (yyyymmddThhmmssZ.shortHash) is generated based on the latest commit.

```javascript
var publish = rquire("publish");
publish.dev();
```

##### parameters #####

* isTest {Boolean} - Indicates if this is a test run, if true a tarball will be generated instead of publishing to NPM.
* options {Object} - The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key. (See: [Options](#options))

## Options ##

<table>
    <thead>
        <tr>
            <th>
                Option
            </th>
            <th>
                Description
            </th>
            <th>
                Default
            </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                `changesCmd`
            </td>
            <td>
                The CLI to execute which determines if there are any uncommitted changes. It should return a string of changes, or nothing.
            </td>
            <td>
                "git status -s -uno"
            </td>
        </tr>
        <tr>
            <td>
                `rawTimestampCmd`
            </td>
            <td>
                The CLI to execute which returns a git format timestamp for the most recent commit.
            </td>
            <td>
                "git show -s --format=%ct HEAD"
            </td>
        </tr>
        <tr>
            <td>
                `revisionCmd`
            </td>
            <td>
                The CLI to execute which returns the most recent commit revision number/hash.
            </td>
            <td>
                "git rev-parse --verify --short HEAD"
            </td>
        </tr>
        <tr>
            <td>
                `packCmd`
            </td>
            <td>
                The CLI to execute which constructs a tarball of the release artifact.
            </td>
            <td>
                "npm pack"
            </td>
        </tr>
        <tr>
            <td>
                `publishCmd`
            </td>
            <td>
                The CLI to execute which publishes a release to NPM.
            </td>
            <td>
                "npm publish"
            </td>
        </tr>
        <tr>
            <td>
                `versionCmd`
            </td>
            <td>
                The CLI to execute which sets the dev version to release under.

                `${version}` will be substituted with the generated dev build version.
            </td>
            <td>
                "npm version --no-git-tag-version ${version}"

                <em><strong>NOTE</strong>: This command will updated the version in the package.json file, but will not commit the change.</em>
            </td>
        </tr>
        <tr>
            <td>
                `distTagCmd`
            </td>
            <td>
                The CLI to execute which tags an NPM release.

                `${version}` will be substituted with the generated dev build version.

                `${tag}` will be substituted with the value from the `devTag` option.
            </td>
            <td>
                "npm dist-tag add infusion@${version} ${tag}"

                <em><strong>NOTE</strong>: This command will updated the version in the package.json file, but will not commit the change.</em>
            </td>
        </tr>
        <tr>
            <td>
                `cleanCmd`
            </td>
            <td>
                The CLI to execute which cleans up any temporary changes to the package.json file.
            </td>
            <td>
                "git checkout -- package.json"
            </td>
        </tr>
        <tr>
            <td>
                `devVersion`
            </td>
            <td>
                The string template for constructing a dev release version number.

                `${version}` will be substituted with the version in the package.json file.

                `${timestamp}` will be substituted with the generated ISO8601 timestamp based on the most recent commit.

                `${revision}` will be substituted with the revision/hash of the most recent commit.
            </td>
            <td>
                "${version}.${timestamp}.${revision}"
            </td>
        </tr>
        <tr>
            <td>
                `devTag`
            </td>
            <td>
                The tag name to use for tagging dev releases.
            </td>
            <td>
                "dev"
            </td>
        </tr>
    </tbody>
</table>

## Publishing Itself ##

Publish can publish itself to NPM. This can be done using any of the [usage](#usage) methods described above, or via the NPM `pub` script defined in [package.json](package.json). The script makes use of the command line interface provided to interact with publish.js. However, with NPM you'll need to provide a set of "--" to identify arguments to the script.

```bash
# publishes a regular release to NPM
npm run pub

# publishes a dev release to NPM
npm run pub -- --dev
```
