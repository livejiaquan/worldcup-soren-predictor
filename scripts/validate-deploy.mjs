import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const deployDir = 'docs'
const requiredFiles = ['index.html', 'CNAME', '.nojekyll', 'data/worldcup.json', 'data/soren-intel.json']
const mirroredDataFiles = ['worldcup.json', 'soren-intel.json']
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

for (const file of mirroredDataFiles) {
  const sourcePath = path.join('public/data', file)
  const deployPath = path.join(deployDir, 'data', file)
  if (await exists(sourcePath) && await exists(deployPath)) {
    const [sourceData, deployData] = await Promise.all([
      readFile(sourcePath),
      readFile(deployPath),
    ])
    if (sha256(sourceData) !== sha256(deployData)) {
      errors.push(`${deployPath} does not match ${sourcePath}`)
    }
  }
}

const indexPath = path.join(deployDir, 'index.html')
if (await exists(indexPath)) {
  const indexHtml = await readFile(indexPath, 'utf8')
  const localReferences = [...indexHtml.matchAll(/\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi)]
    .map((match) => match.slice(1).find((value) => value !== undefined))
    .filter(Boolean)
    .filter((reference) => !/^(?:[a-z]+:|\/\/|#)/i.test(reference))
    .map((reference) => reference.split(/[?#]/, 1)[0])

  for (const reference of localReferences) {
    if (reference.startsWith('/')) {
      errors.push(`root-relative asset reference is not portable: ${reference}`)
      continue
    }
    const deployRoot = path.resolve(deployDir)
    const referencedPath = path.resolve(deployRoot, reference)
    if (referencedPath !== deployRoot && !referencedPath.startsWith(`${deployRoot}${path.sep}`)) {
      errors.push(`referenced asset escapes deploy directory: ${reference}`)
      continue
    }
    const displayPath = path.relative(process.cwd(), referencedPath)
    if (!await exists(referencedPath)) {
      errors.push(`missing referenced asset: ${displayPath}`)
    } else if (!(await stat(referencedPath)).isFile()) {
      errors.push(`referenced asset is not a file: ${displayPath}`)
    }
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
