const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes('--dev');
const srcDir = path.resolve(__dirname, '../src');
const distDir = path.resolve(__dirname, '../dist');

// Clean dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}

// Copy static files
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy manifest
fs.mkdirSync(distDir, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
manifest.version = pkg.version;
fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

// Copy HTML, CSS
const staticFiles = [
  ['sidepanel/sidepanel.html', 'sidepanel/sidepanel.html'],
  ['sidepanel/sidepanel.css', 'sidepanel/sidepanel.css'],
  ['options/options.html', 'options/options.html'],
  ['options/options.css', 'options/options.css'],
];

for (const [src, dest] of staticFiles) {
  const destPath = path.join(distDir, dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(path.join(srcDir, src), destPath);
}

// Copy assets
if (fs.existsSync(path.join(srcDir, 'assets'))) {
  copyDir(path.join(srcDir, 'assets'), path.join(distDir, 'assets'));
}

// Bundle JS files
const entryPoints = [
  { in: path.join(srcDir, 'background/service-worker.js'), out: 'background/service-worker' },
  { in: path.join(srcDir, 'sidepanel/sidepanel.js'), out: 'sidepanel/sidepanel' },
  { in: path.join(srcDir, 'options/options.js'), out: 'options/options' },
  { in: path.join(srcDir, 'content/content-script.js'), out: 'content/content-script' },
];

esbuild.build({
  entryPoints: entryPoints.map(e => ({ in: e.in, out: e.out })),
  bundle: true,
  outdir: distDir,
  format: 'iife',
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
  target: 'chrome110',
}).then(() => {
  console.log(`Build complete (${isDev ? 'dev' : 'production'}) → dist/`);
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
