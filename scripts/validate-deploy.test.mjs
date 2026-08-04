import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const validator = fileURLToPath(new URL('./validate-deploy.mjs', import.meta.url))

async function createFixture(indexHtml) {
  const root = await mkdtemp(path.join(tmpdir(), 'worldcup-deploy-'))
  await mkdir(path.join(root, 'docs/assets'), { recursive: true })
  await mkdir(path.join(root, 'docs/data'), { recursive: true })
  await mkdir(path.join(root, 'public/data'), { recursive: true })

  const files = {
    'docs/index.html': indexHtml,
    'docs/CNAME': 'worldcup.kyasen.com\n',
    'docs/.nojekyll': '',
    'docs/assets/unrelated.js': 'console.log("stale")\n',
    'docs/assets/site.css': 'body {}\n',
    'docs/data/worldcup.json': '{}\n',
    'docs/data/soren-intel.json': '[]\n',
    'public/data/worldcup.json': '{}\n',
    'public/data/soren-intel.json': '[]\n',
    'package.json': '{}\n',
  }
  await Promise.all(Object.entries(files).map(([relativePath, content]) => (
    writeFile(path.join(root, relativePath), content)
  )))
  return root
}

test('accepts an index whose local assets are present', async () => {
  const root = await createFixture(`<!doctype html>
<link rel="stylesheet" href="./assets/site.css?v=1">
<script type="module" src="./assets/unrelated.js#entry"></script>`)

  try {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects an index that references a missing local asset', async () => {
  const root = await createFixture(`<!doctype html>
<link rel="stylesheet" href="./assets/site.css">
<script type="module" src="./assets/missing.js"></script>`)

  try {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /missing referenced asset: docs\/assets\/missing\.js/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects missing assets in case-insensitive unquoted attributes', async () => {
  const root = await createFixture(`<!doctype html>
<link rel="stylesheet" href="./assets/site.css">
<SCRIPT SRC = ./assets/missing.js></SCRIPT>`)

  try {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /missing referenced asset: docs\/assets\/missing\.js/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects a local asset reference that resolves to a directory', async () => {
  const root = await createFixture(`<!doctype html>
<link rel="stylesheet" href="./assets/site.css">
<script type="module" src="./assets/"></script>`)

  try {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /referenced asset is not a file: docs\/assets/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects root-relative asset references that break project Pages URLs', async () => {
  const root = await createFixture(`<!doctype html>
<link rel="stylesheet" href="./assets/site.css">
<script type="module" src="/assets/unrelated.js"></script>`)

  try {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /root-relative asset reference is not portable: \/assets\/unrelated\.js/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects an index reference that escapes the deploy directory', async () => {
  const root = await createFixture(`<!doctype html>
<link rel="stylesheet" href="./assets/site.css">
<script type="module" src="../package.json"></script>`)

  try {
    const result = spawnSync(process.execPath, [validator], { cwd: root, encoding: 'utf8' })
    assert.notEqual(result.status, 0, `validator unexpectedly passed:\n${result.stdout}`)
    assert.match(result.stderr, /referenced asset escapes deploy directory: \.\.\/package\.json/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
