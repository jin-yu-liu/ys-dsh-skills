/**
 * Skill bundles: one gzipped JSON file per available skill holding every file
 * of `skills/<name>/`, so a remote client (the dsh-leap plugin) can install
 * the whole directory with one verified download instead of fetching
 * hundreds of raw files. Shared by build-skill-bundles.mjs and validate.mjs.
 *
 * Bundle (after gunzip): { format: 1, name, files: [{ path, text } | { path, base64 }] },
 * `path` relative to the skill directory, sorted. The catalog entry records
 * `skill.bundle = { path, sha256, size, files }` of the gzipped bytes.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { gzipSync } from 'node:zlib'

/** Files that never ship (caches, editor litter). */
const SKIP = new Set(['__pycache__', '.DS_Store'])

/** @returns sorted repository-relative file list of one skill directory. */
export function skillFiles(root, name) {
  const base = join(root, 'skills', name)
  const out = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIP.has(entry.name) || entry.name.endsWith('.pyc')) continue
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) out.push(relative(base, full).split(sep).join('/'))
    }
  }
  walk(base)
  return out.sort()
}

/** UTF-8 text unless the bytes do not round-trip (then base64). */
function encode(bytes) {
  const text = bytes.toString('utf8')
  return Buffer.from(text, 'utf8').equals(bytes) && !text.includes('\u0000') ? { text } : { base64: bytes.toString('base64') }
}

/** @returns the bundle document of one skill as it is on disk now. */
export function bundleDocument(root, name) {
  return {
    format: 1,
    name,
    files: skillFiles(root, name).map(path => ({ path, ...encode(readFileSync(join(root, 'skills', name, path))) })),
  }
}

/** @returns gzipped bundle bytes. */
export function packBundle(document) {
  return gzipSync(Buffer.from(JSON.stringify(document)), { level: 9 })
}

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export const bundlePath = name => `bundles/${name}.json.gz`
