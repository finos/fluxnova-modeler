# Changelog

All notable changes to the [Fluxnova Modeler](https://github.com/finos/fluxnova-modeler) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

**\_Note:** Yet to be released changes appear here.\_


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
