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

### Command Line ###

Run these commands from the root directory of the module to be published.

```bash
# creates a dev release (global install)
fluid-publish

# creates a dev release (local install)
./node_modules/.bin/fluid-publish
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

#### --options #####

__value__: {String} stringified JSON object

A stringified JSON object containing overrides to the default options used across the publish script. The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key.

(See: [Options](#options))

```bash
# publishes a dev build and applies the tag "nightly" to it
fluid-publish --options="{'devTag': 'nightly'}"
```

### Node ###

##### parameters #####

 * isTest {Boolean} - Indicates if this is a test run, if true a tarball will be generated instead of publishing to NPM.
 * options {Object} - The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key. (See: [Options](#options))

#### `dev` ####

Publishes a development build. This creates a release named after the version, but with the build stamp appended to the end. By default this will create a release with version X.x.x-prerelease.yyyymmddThhmmssZ.shortHash where X.x.x is sourced from the version number in the package.json file, -prerelease is from the `devTag` option (also applied as a tag to the release), and the build identifier (yyyymmddThhmmssZ.shortHash) is generated based on the latest commit.

```javascript
var publish = require("fluid-publish");
publish.dev();
```

##### parameters #####

* isTest {Boolean} - Indicates if this is a test run, if true a tarball will be generated instead of publishing to NPM.
* options {Object} - The defaults can be found in publish.js's [package.json](package.json) file under the `defaultOptions` key. (See: [Options](#options))

#### `standard` ####

Publishes a release build. This creates a release named after the version in the package.json file. By default it will not increase the version number, this must be done separately. However, it will create a tag and publish this tag to the version control system.

```javascript
var publish = require("fluid-publish");
publish.standard();
```

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
                <code>distTagCmd</code>
            </td>
            <td>
                The CLI to execute which tags an NPM release.
                <ul>
                    <li>
                        <code>${packageName}</code> will be substituted with executing module's name.
                    </li>
                    <li>
                        <code>${version}</code> will be substituted with the generated dev build version.
                    </li>
                    <li>
                        <code>${tag}</code>will be substituted with the value from the <code>devTag</code> option.
                    </li>
                </ul>
            </td>
            <td>
                "npm dist-tag add ${packageName}@${version} ${tag}"
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
                The CLI to execute which cleans up any temporary changes to the package.json file.
                <ul>
                    <li>
                        <code>${package}</code> will be substituted with the path to the executing modules package.json file.
                    </li>
                </ul>
            </td>
            <td>
                "git checkout -- ${package}"
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
