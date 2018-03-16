# fluid-publish #
A command line tool and node module that can be used to simplify the process of publishing a module to NPM. This is particularly useful for creating development releases, e.g. nightly or continuous integration releases.

By default this will create a release with version __X.x.x-prerelease.yyyymmddThhmmssZ.shortHash__ where __X.x.x__ is sourced from the version number in the package.json file, __-prerelease__ is from the `devTag` option (also applied as a tag to the release), and the __yyyymmddThhmmssZ.shortHash__ build identifier is generated based on the latest commit.

## Installation ##

```bash
# global install
npm install fluid-publish -g

# local dev install
npm install fluid-publish --save-dev
```

## Usage ##

### Command Line API ###

Run these commands from the root directory of the module to be published.

```bash
# creates a dev release (global install)
fluid-publish

# creates a dev release (local install)
./node_modules/.bin/fluid-publish
```

#### --version ####

__value__: true (Boolean)

Returns the current version of the Fluid-Publish module itself. No publishing
steps will occur when this flag is enabled.

```bash
# returns the version of fluid-publish
fluid-publish --version
# fluid-publish 2.0.0
```


#### --standard ####

__value__: true (Boolean)

Specifies that a standard release should be generated. This creates a release named after the version in the package.json file. It will not increase the version number. However, it will create a tag and publish this tag to the version control system.

```bash
# creates a standard release
fluid-publish --standard
```

#### --test ####

__value__: true (Boolean)

Specifies that a tarball should be created instead of publishing to NPM. This is useful to use a means of testing that the publish will happen correctly.

```bash
# creates a tarball
fluid-publish --test
fluid-publish --test --standard

# publishes to NPM
fluid-publish
fluid-publish --standard
```

#### options #####

Optional key/value pairs, in the form `key=value`, to override the default configuration used across the publish script. The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key.

<em><strong>NOTE</strong>: If only a <code>key</code> is provided, the value is assumed to be <code>true</code></em>

(See: [Options](#options), [process.argv](https://nodejs.org/docs/latest/api/process.html#process_process_argv))

```bash
# publishes a dev build and applies the tag "nightly" to it
fluid-publish devTag="nightly"
```

### JavaScript API ###

fluid.publish can also be accessed through standard JavaScript function calls in a  [node](https://nodejs.org) app.


#### `dev` ####

Publishes a development build. This creates a release named after the version, but with the build stamp appended to the end. By default this will create a release with version X.x.x-prerelease.yyyymmddThhmmssZ.shortHash where X.x.x is sourced from the version number in the package.json file, -prerelease is from the `devTag` option (also applied as a tag to the release), and the build identifier (yyyymmddThhmmssZ.shortHash) is generated based on the latest commit.

```javascript
var publish = require("fluid-publish");
publish.dev();
```

##### arguments #####

 1. isTest {Boolean} - Indicates if this is a test run, if true a tarball will be generated instead of publishing to NPM.
 2. options {Object} - The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key. (See: [Options](#options))

#### `standard` ####

Publishes a release build. This creates a release named after the version in the package.json file. By default it will not increase the version number, this must be done separately. However, it will create a tag and publish this tag to the version control system.

```javascript
var publish = require("fluid-publish");
publish.standard();
```

##### arguments #####

 1. isTest {Boolean} - Indicates if this is a test run, if true a tarball will be generated instead of publishing to NPM.
 2. options {Object} - The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key. (See: [Options](#options))

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
                <code>changesCmd</code>
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
                <code>checkRemoteCmd</code>
            </td>
            <td>
                The CLI to execute which determines if the remote repository exists. This prevents trying to push a version control tag to a repo that doesn't exist.
            </td>
            <td>
                "git ls-remote --exit-code ${remote}"
            </td>
        </tr>
        <tr>
            <td>
                <code>rawTimestampCmd</code>
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
                <code>revisionCmd</code>
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
                <code>packCmd</code>
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
                <code>publishCmd</code>
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
                <code>publishDevCmd</code>
            </td>
            <td>
                The CLI to execute which publishes a development release to NPM.
                Uses the value specified by the `devTag` option.
            </td>
            <td>
                "npm publish --tag ${devTag}"
            </td>
        </tr>
        <tr>
            <td>
                <code>versionCmd</code>
            </td>
            <td>
                The CLI to execute which sets the dev version to release under.
                <ul>
                    <li>
                        <code>${version}</code> will be substituted with the generated dev build version.
                    </li>
                </ul>
            </td>
            <td>
                "npm version --no-git-tag-version ${version}"
                <br>
                <br>
                <p>
                    <em><strong>NOTE</strong>: This command will update the version in the package.json file, but will not commit the change.</em>
                </p>
            </td>
        </tr>
        <tr>
            <td>
                <code>cleanCmd</code>
            </td>
            <td>
                The CLI to execute which cleans up any temporary changes to the package.json and package-lock.json files.
            </td>
            <td>
                "git checkout -- package.json package-lock.json"
            </td>
        </tr>
        <tr>
            <td>
                <code>vcTagCmd</code>
            </td>
            <td>
                The CLI to execute which creates the version control tag.
                <ul>
                    <li>
                        <code>${version}</code> will be substituted with the version from the package.json file.
                    </li>
                </ul>
            </td>
            <td>
                "git tag -a v${version} -m 'Tagging the ${version} release'"
            </td>
        </tr>
        <tr>
            <td>
                <code>pushVCTagCmd</code>
            </td>
            <td>
                The CLI to execute which publishes the version control tag.
                <ul>
                    <li>
                        <code>${version}</code> will be substituted with the version from the package.json file.
                    </li>
                </ul>
            </td>
            <td>
                "git push upstream v${version}"
            </td>
        </tr>
        <tr>
            <td>
                <code>devVersion</code>
            </td>
            <td>
                The string template for constructing a dev release version number.
                <ul>
                    <li>
                        <code>${version}</code> will be substituted with the version in the package.json file.
                    </li>
                    <li>
                        <code>${timestamp}</code> will be substituted with the generated ISO8601 timestamp based on the most recent commit.
                    </li>
                    <li>
                        <code>${revision}</code> will be substituted with the revision/hash of the most recent commit.
                    </li>
                </ul>    
            </td>
            <td>
                "${version}.${timestamp}.${revision}"
            </td>
        </tr>
        <tr>
            <td>
                <code>devTag</code>
            </td>
            <td>
                The tag name to use for tagging dev releases.
            </td>
            <td>
                "dev"
            </td>
        </tr>
        <tr>
            <td>
                <code>remoteName</code>
            </td>
            <td>
                The remote repository to push version control tag to.
            </td>
            <td>
                "upstream"
            </td>
        </tr>
        <tr>
            <td>
                <code>changesHint</code>
            </td>
            <td>
                A hint for addressing uncommitted changes.
            </td>
            <td>
                "Address uncommitted changes: Commit \"git commit -a\", Stash \"git stash\" or Clean \"git reset --hard\"\n"
            </td>
        </tr>
        <tr>
            <td>
                <code>checkRemoteHint</code>
            </td>
            <td>
                A hint for addressing an issue where the remote repository cannot be found.
            </td>
            <td>
                "Run \"git remote -v\" for a list of available remote repositories.\n"
            </td>
        </tr>
        <tr>
            <td>
                <code>publishHint</code>
            </td>
            <td>
                A hint for addressing an issue where publishing a standard release to the registry fails.
            </td>
            <td>
                "Ensure that you have access to publish to the registry and that the current version does not already exist.\n"
            </td>
        </tr>
        <tr>
            <td>
                <code>publishDevHint</code>
            </td>
            <td>
                A hint for addressing an issue where publishing a development (pre-release) to the registry fails.
            </td>
            <td>
                "Ensure that you have access to publish to the registry and that the current version does not already exist.\nIf the npm tag specified by --tag is recognizable as a valid semver version number, it will be rejected by npm. This is because version numbers and tags share a common namespace for npm packages.\n"
            </td>
        </tr>
        <tr>
            <td>
                <code>vcTagHint</code>
            </td>
            <td>
                A hint for addressing an issue where applying a version control tag fails.
            </td>
            <td>
                "If the tag already exists, run \"git tag -d v${version}\" to remove the existing tag.\n"
            </td>
        </tr>
        <tr>
            <td>
                <code>pushVCTagHint</code>
            </td>
            <td>
                A hint for addressing an issue where pushing a version control tag to a remote repository fails.
            </td>
            <td>
                "If the tag already exists, run \"git push ${remote} :refs/tags/v${version} to remove the existing tag.\n"
            </td>
        </tr>
    </tbody>
</table>

## Publishing Itself ##

Publish can publish itself to NPM. This can be done using any of the [usage](#usage) methods described above, or via the NPM `pub` script defined in [package.json](package.json). The script makes use of the command line interface provided to interact with publish.js. However, with NPM you'll need to provide a set of "--" to identify arguments to the script.

```bash
# publishes a dev release to NPM
npm run pub

# publishes a standard release to NPM
npm run pub -- --standard
```
