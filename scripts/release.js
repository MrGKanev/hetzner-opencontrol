#!/usr/bin/env node
/**
 * Bump version in package.json, commit, and push to trigger a new CI release.
 * Usage:
 *   npm run release          → bumps patch (0.0.3 → 0.0.4)
 *   npm run release minor    → bumps minor (0.0.3 → 0.1.0)
 *   npm run release major    → bumps major (0.0.3 → 1.0.0)
 *   npm run release 1.2.3    → sets exact version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const bump = process.argv[2] || 'patch';
const [major, minor, patch] = pkg.version.split('.').map(Number);

let newVersion;
if (/^\d+\.\d+\.\d+$/.test(bump)) {
  newVersion = bump;
} else if (bump === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bump === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`${pkg.version.replace(newVersion, '')}${newVersion} — bumped from ${major}.${minor}.${patch}`);

const run = cmd => execSync(cmd, { stdio: 'inherit' });

run(`git add package.json`);
run(`git commit -m "Release ${newVersion}"`);
run(`git push`);

console.log(`\n✓ Pushed v${newVersion} — CI build started`);
