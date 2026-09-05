#!/usr/bin/env node

/**
 * Builds all plugins listed under "modelerPlugins" in the root package.json.
 *
 * Each plugin directory must have a `package.json` with an `all` script that
 * compiles the plugin (e.g. runs webpack).
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

const rootPkg = require(path.join(ROOT_DIR, 'package.json'));

const plugins = rootPkg.modelerPlugins || [];

if (!plugins.length) {
  process.exit(0);
}

// On Windows npm is npm.cmd; on Unix it is npm
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const pluginPath of plugins) {
  const absPath = path.resolve(ROOT_DIR, pluginPath);
  const opts = { cwd: absPath, stdio: 'inherit' };

  console.log(`Building plugin at ${absPath}`);

  run(npm, [ 'install' ], opts);
  run(npm, [ 'run', 'all' ], opts);
}

function run(cmd, args, opts) {
  const result = spawnSync(cmd, args, opts);

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
