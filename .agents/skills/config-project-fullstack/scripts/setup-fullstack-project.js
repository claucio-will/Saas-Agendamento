#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = process.cwd();
const args = process.argv.slice(2);
const namespaceArg = args.indexOf('--namespace');
const namespace = namespaceArg !== -1 ? args[namespaceArg + 1] : null;

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: opts.cwd || ROOT, ...opts });
}

function checkEmpty() {
  const allowed = new Set(['.agents', '.claude', 'SKILL.md']);
  const entries = fs.readdirSync(ROOT).filter(e => !allowed.has(e));
  if (entries.length > 0) {
    console.error(`Error: directory must be empty (or contain only .agents / .claude). Found: ${entries.join(', ')}`);
    process.exit(1);
  }
}

function checkCommands() {
  for (const cmd of ['node', 'npm', 'npx']) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' });
    } catch {
      console.error(`Error: required command not found: ${cmd}`);
      process.exit(1);
    }
  }
}

function moveDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === '.agents' || entry.name === '.claude') continue;
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      moveDir(srcPath, destPath);
      fs.rmdirSync(srcPath);
    } else {
      fs.renameSync(srcPath, destPath);
    }
  }
}

function rewriteJson(filePath, fn) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, JSON.stringify(fn(content), null, 2) + '\n');
}

function rewritePackageName(pkgPath, newName) {
  rewriteJson(pkgPath, pkg => ({ ...pkg, name: newName }));
}

function applyNamespace(ns) {
  const rootPkg = path.join(ROOT, 'package.json');
  const rootName = path.basename(ROOT);
  rewritePackageName(rootPkg, `${ns}/${rootName}`);

  const frontendPkg = path.join(ROOT, 'apps', 'frontend', 'package.json');
  rewritePackageName(frontendPkg, `${ns}/frontend`);

  const backendPkg = path.join(ROOT, 'apps', 'backend', 'package.json');
  rewritePackageName(backendPkg, `${ns}/backend`);

  const packagesDir = path.join(ROOT, 'packages');
  if (fs.existsSync(packagesDir)) {
    for (const pkg of fs.readdirSync(packagesDir)) {
      const pkgJson = path.join(packagesDir, pkg, 'package.json');
      if (fs.existsSync(pkgJson)) {
        rewritePackageName(pkgJson, `${ns}/${pkg}`);
      }
    }
  }
}

// --- Main ---

checkEmpty();
checkCommands();

const rootName = path.basename(ROOT);
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turbo-'));
const tmpProject = path.join(tmpDir, rootName);

console.log('\n==> Creating Turbo monorepo in temp directory...');
run(`npx --yes create-turbo@latest ${rootName} -m npm`, { cwd: tmpDir });

console.log('\n==> Moving monorepo contents to current directory...');
moveDir(tmpProject, ROOT);
fs.rmdirSync(tmpProject, { recursive: true });

console.log('\n==> Removing default Turbo apps (docs, web)...');
for (const app of ['docs', 'web']) {
  const appPath = path.join(ROOT, 'apps', app);
  if (fs.existsSync(appPath)) {
    fs.rmSync(appPath, { recursive: true, force: true });
  }
}

console.log('\n==> Creating Next.js frontend...');
run(`npx --yes create-next-app@latest frontend --yes --src-dir --use-npm`, { cwd: path.join(ROOT, 'apps') });

console.log('\n==> Creating NestJS backend...');
run(`npx --yes @nestjs/cli@latest new backend --package-manager npm --skip-git`, { cwd: path.join(ROOT, 'apps') });

console.log('\n==> Installing @nestjs/config in backend...');
run(`npm install @nestjs/config`, { cwd: path.join(ROOT, 'apps', 'backend') });

console.log('\n==> Configuring backend app.module.ts...');
fs.writeFileSync(
  path.join(ROOT, 'apps', 'backend', 'src', 'app.module.ts'),
  `import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`
);

console.log('\n==> Configuring backend main.ts (CORS + PORT)...');
fs.writeFileSync(
  path.join(ROOT, 'apps', 'backend', 'src', 'main.ts'),
  `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
`
);

console.log('\n==> Updating backend dev script...');
rewriteJson(path.join(ROOT, 'apps', 'backend', 'package.json'), pkg => ({
  ...pkg,
  scripts: { ...pkg.scripts, start: 'nest start', dev: 'nest start --watch' },
}));

console.log('\n==> Creating environment files...');
fs.writeFileSync(path.join(ROOT, 'apps', 'frontend', '.env.example'), 'NEXT_PUBLIC_API_URL=http://localhost:4000\n');
fs.writeFileSync(path.join(ROOT, 'apps', 'frontend', '.env'), 'NEXT_PUBLIC_API_URL=http://localhost:4000\n');
fs.writeFileSync(path.join(ROOT, 'apps', 'backend', '.env.example'), 'PORT=4000\n');
fs.writeFileSync(path.join(ROOT, 'apps', 'backend', '.env'), 'PORT=4000\n');

if (namespace) {
  console.log(`\n==> Applying namespace ${namespace}...`);
  applyNamespace(namespace);
}

console.log('\n==> Validating...');
for (const app of ['docs', 'web']) {
  if (fs.existsSync(path.join(ROOT, 'apps', app))) {
    console.error(`Error: apps/${app} still exists after cleanup.`);
    process.exit(1);
  }
}

console.log('\n✓ Fullstack monorepo created successfully!');
console.log('  Frontend: apps/frontend (port 3000)');
console.log('  Backend:  apps/backend  (port 4000)');
if (namespace) console.log(`  Namespace: ${namespace}`);
