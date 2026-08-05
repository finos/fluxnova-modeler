#!/usr/bin/env node

/**
 * Builds all plugins listed under "modelerPlugins" in the root package.json.
 *
 * Each plugin directory must have a `package.json` with an `all` script that
 * compiles the plugin (e.g. runs webpack).
 */

const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

const rootPkg = require(path.join(ROOT_DIR, 'package.json'));

const plugins = rootPkg.modelerPlugins || [];

if (!plugins.length) {
  process.exit(0);
}

for (const pluginPath of plugins) {
  const absPath = path.resolve(ROOT_DIR, pluginPath);

  console.log(`Building plugin at ${absPath}`);

  execSync('npm install', {
    cwd: absPath,
    stdio: 'inherit'
  });

  execSync('npm run all', {
    cwd: absPath,
    stdio: 'inherit'
  });
}
