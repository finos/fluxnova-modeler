# Changelog

All notable changes to the [Fluxnova Modeler](https://github.com/finos/fluxnova-modeler) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

**\_Note:** Yet to be released changes appear here.\_

- Breaking: Electron 44 drops support for Windows ia32 and macOS 12 (Monterey). Supported macOS versions are now macOS 13 (Ventura) and newer.

## 1.3.3

- Added OpenID Connect (OIDC) authentication for deploying and starting process instances on Fluxnova engines (#131)
- Added support for transient variables in input/output parameters and element templates
- Added support for 3.1.0 execution platform version
- Fixed users being unable to override the Fluxnova engine version when creating new BPMNs (#88)
- Fixed slow performance of diagram updates in very large BPMN files (#110)
- Fixed tab drag-and-drop reordering
- Fixed critical security vulnerabilities in tar and shell-quote dependencies
- Updated electron from 42.3.3 to 44.0.0 and removed Windows ia32 build support
- Updated diagram-js from 15.2.4 to 15.24.1
- Updated bpmn-js from 18.3.1 to 18.25.0
- Updated bpmn-js-properties-panel from 5.32.1 to 5.64.0
- Updated camunda-bpmn-js from 5.6.1 to 5.32.0
- Updated dmn-js from 17.1.0 to 17.10.2
- Updated dmn-js-properties-panel from 3.7.0 to 3.11.1
- Updated camunda-dmn-js from 3.1.1 to 3.8.2
- Updated drag-tabs from 2.3.1 to 3.0.0
- Updated GitHub Actions workflows to Node.js 24 and actions/checkout v6 (#135)
- Updated actions/upload-artifact from v4 to v6 (#135)
- Updated CodeQL action from v3 to v4
- Added MAINTAINERS.md file
- Updated SECURITY.md to the FINOS CRA stewardship template

## 1.3.2

- Fixed form properties and form components missing on form import/create (#119)
- Fixed DMN import and decision modification crashing (#120)

## 1.3.1

- Fixed deep links to use correct Fluxnova Monitoring URL path (#108)
- Hardened React 18 tab update-cycle and callback lifecycle behavior (#113)
- Fixed BPMN canvas copy/paste (#114)

## 1.3.0

- Updated react, react-dom, react-test-renderer from 16.14.0 to 18.3.1
- Updated formik from 2.0.4 to 2.4.9
- Updated electron from 37.0.0 to 42.3.3
- Updated electron-extension-installer from 1.2.0 to 2.0.0
- Migrated tests to @testing-library/react and removed enzyme dependency
- Refactored Windows code signing logic to utilize Azure trusted signing
- Fixed DMN tab state that was always marked as dirty
- Added support for 3.0.0 execution platform version
- Added support for restricted variables
- Added support for ad-hoc subprocesses

## 1.2.0

- Added retry time cycle functionality for element templates
- Enabled hybrid model for Karma to Jest to enable running of both suites in parallel
- Add support for 2.0.0 execution platform version

## 1.1.1

- Fixed issue with broken Monitoring link
- Updated puppeteer dependency from 24.0.0 to 24.28.0

## 1.1.0

- Updated the "Learn more" link in the change execution platform pop-up to point to https://docs.fluxnova.finos.org/
- Fixed lint errors causing `npm run lint` script to fail
- Fixed issue where running `npm run build` locally multiple times continually appends "-dev" to build artifact names
- Fixed issue where RELEASE workflow creates multiple draft releases with slightly different names
- Updated nodemailer dependency from v6 to v7

## 1.0.0

- Initial Release
