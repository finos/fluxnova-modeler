/**
 * Copies plugins listed under "modelerPlugins" in the root package.json into
 * the packaged application's resources directory so they are available at
 * runtime.
 *
 * Only the plugin descriptor (index.js) and the compiled output (dist/) are
 * copied — source files and node_modules are intentionally excluded.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');

const rootPkg = require(path.join(ROOT_DIR, 'package.json'));

module.exports = async function addPlugins(context) {
  const { appOutDir } = context;

  const plugins = rootPkg.modelerPlugins || [];

  for (const pluginPath of plugins) {
    const absPluginPath = path.resolve(ROOT_DIR, pluginPath);
    const pluginName = path.basename(absPluginPath);
    const destDir = path.join(appOutDir, 'resources', 'plugins', pluginName);

    fs.mkdirSync(destDir, { recursive: true });

    // Copy the plugin descriptor
    const descriptorSrc = path.join(absPluginPath, 'index.js');
    if (fs.existsSync(descriptorSrc)) {
      fs.copyFileSync(descriptorSrc, path.join(destDir, 'index.js'));
    } else {
      console.warn(`[add-plugins] Skipping ${pluginName}: index.js not found`);
      continue;
    }

    // Copy the compiled dist/ directory
    const distSrc = path.join(absPluginPath, 'dist');
    if (fs.existsSync(distSrc)) {
      copyDirSync(distSrc, path.join(destDir, 'dist'));
    } else {
      console.warn(`[add-plugins] Skipping ${pluginName}: dist/ not found — was the plugin built?`);
    }
  }
};


function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
