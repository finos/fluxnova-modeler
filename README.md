[![FINOS - Incubating](https://cdn.jsdelivr.net/gh/finos/contrib-toolbox@master/images/badge-incubating.svg)](https://community.finos.org/docs/governance/Software-Projects/stages/incubating)

# Fluxnova Modeler


[![CI](https://github.com/finos/fluxnova-modeler/actions/workflows/CI.yml/badge.svg)](https://github.com/finos/fluxnova-modeler/actions/workflows/CI.yml)

An integrated modeling solution for BPMN, DMN, and Forms based on [bpmn.io](http://bpmn.io).

![Fluxnova Modeler](resources/screenshot.png)

## Resources

* [Changelog](./CHANGELOG.md)
* [Report a Bug](https://github.com/finos/fluxnova-modeler/issues)

## Plugins

Fluxnova Modeler supports client-side plugins to extend and customise its functionality. See the [Fluxnova Modeler Plugins](https://github.com/finos/fluxnova-modeler-plugins) repository for available plugins.

### Adding a Plugin

List your plugin directories in the `modelerPlugins` array in the root [`package.json`](package.json)

```json
{
  "modelerPlugins": [
    "./resources/plugins/my-plugin"
  ]
}
```

Each entry is a path (relative to the repo root) to a plugin directory containing an `index.js` descriptor and a compiled `dist/` folder.

### Running in Development Mode

Listed plugins are automatically built and loaded when you start the application in development mode:

```sh
npm run dev
```

### Production Build

Listed plugins are automatically built and bundled into the packaged application:

```sh
npm run build
```

The plugin `index.js` and `dist/` assets are copied into the application's `resources/plugins/` directory at pack time.

## Building the Application

Build the app in a Posix environment. On Windows that is Git Bash or WSL. Make sure you have installed all the [necessary tools](https://github.com/nodejs/node-gyp#installation) to install and compile Node.js C++ addons.

```sh
# checkout a tag
git checkout main

# install dependencies
npm install

# build the application to ./dist
npm run build
```

### Development Setup


Spin up the application for development, all strings attached:

```sh
npm run dev
```

### Development Setup
Please checkout our [troubleshooting guide](./TROUBLESHOOTING.md) if you are experiencing issues when building from source.



## Contributing

Please checkout our [contributing guidelines](./CONTRIBUTING.md) if you plan to file an issue or pull request.

## License

Copyright 2025 FINOS

MIT

Uses [bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), [cmmn-js](https://github.com/bpmn-io/cmmn-js), and [form-js](https://github.com/bpmn-io/form-js) licensed under the [bpmn.io license](http://bpmn.io/license).

