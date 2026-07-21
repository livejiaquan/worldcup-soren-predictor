import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const deployDir = 'docs'
const requiredFiles = ['index.html', 'CNAME', '.nojekyll', 'data/worldcup.json']
const errors = []

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

for (const relativePath of requiredFiles) {
  if (!await exists(path.join(deployDir, relativePath))) {
    errors.push(`missing deploy artifact: ${deployDir}/${relativePath}`)
  }
}

if (await exists('public/data/worldcup.json') && await exists('docs/data/worldcup.json')) {
  const [sourceData, deployData] = await Promise.all([
    readFile('public/data/worldcup.json'),
    readFile('docs/data/worldcup.json'),
  ])
  if (sha256(sourceData) !== sha256(deployData)) {
    errors.push('docs/data/worldcup.json does not match public/data/worldcup.json')
  }
}

if (await exists('docs/assets')) {
  const assets = await readdir('docs/assets')
  if (!assets.some((file) => file.endsWith('.js'))) errors.push('deploy assets missing JavaScript bundle')
  if (!assets.some((file) => file.endsWith('.css'))) errors.push('deploy assets missing CSS bundle')
} else {
  errors.push('missing deploy artifact: docs/assets')
}

if (await exists('docs/CNAME')) {
  const cname = (await readFile('docs/CNAME', 'utf8')).trim()
  if (cname !== 'worldcup.kyasen.com') errors.push(`unexpected CNAME: ${cname || '(empty)'}`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Deploy artifacts validated: docs/ contains matching data, assets, CNAME, and .nojekyll.')
