#!/usr/bin/env node
import { existsSync, readdirSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))
const virtualStoreDir = join(projectRoot, 'node_modules', '.pnpm')
if (!existsSync(virtualStoreDir)) {
  console.error('Unable to locate pnpm virtual store at', virtualStoreDir)
  process.exit(1)
}
const vitestStoreEntry = readdirSync(virtualStoreDir).find((entry) => entry.startsWith('vitest@'))
if (!vitestStoreEntry) {
  console.error('Unable to locate a vitest entry inside', virtualStoreDir)
  console.error('Did you run "pnpm install" in the monorepo?')
  process.exit(1)
}
const vitestPackageDir = join(virtualStoreDir, vitestStoreEntry, 'node_modules')
const vitestCli = join(vitestPackageDir, 'vitest', 'vitest.mjs')
if (!existsSync(vitestCli)) {
  console.error('Found vitest package but the CLI entry point is missing at', vitestCli)
  process.exit(1)
}
const args = process.argv.slice(2)
const env = {
  ...process.env,
  NODE_PATH: process.env.NODE_PATH
    ? `${vitestPackageDir}${delimiter}${process.env.NODE_PATH}`
    : vitestPackageDir,
}
const child = spawn(process.execPath, [vitestCli, ...args], {
  stdio: 'inherit',
  env,
})
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 1)
  }
})