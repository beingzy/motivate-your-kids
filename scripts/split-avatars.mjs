#!/usr/bin/env node
/**
 * Splits the Figma-exported full-set.svg into individual avatar SVGs.
 * Each avatar is a top-level <g clip-path="..."> in the source file.
 * Grid: 6 cols x 5 rows, 160x160 each, 24px gap → positions at 0,184,368,552,736,920
 */
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcPath = join(__dirname, '..', 'public', 'avatars', 'presets', 'full-set.svg')
const outDir = join(__dirname, '..', 'public', 'avatars', 'presets')

const src = readFileSync(srcPath, 'utf8')

// Extract the <defs>...</defs> block
const defsMatch = src.match(/<defs>([\s\S]*?)<\/defs>/)
if (!defsMatch) { console.error('No <defs> found'); process.exit(1) }
const defsContent = defsMatch[1]

// Extract top-level avatar groups — they are direct children of the root <svg>
// Each starts with <g clip-path="url(#clipN_...)"> and ends with </g>
// We need to match nested groups carefully
const avatarGroups = []
const groupRegex = /<g clip-path="url\(#clip(\d+)_10111_1923\)">/g
let match
while ((match = groupRegex.exec(src)) !== null) {
  const clipNum = parseInt(match[1])
  // Only even-numbered clips are top-level avatar groups (odd are inner clips)
  if (clipNum % 2 !== 0) continue

  const startIdx = match.index
  // Find the matching closing </g> — count nesting
  let depth = 0
  let i = startIdx
  let endIdx = -1
  while (i < src.length) {
    if (src.startsWith('<g', i) && (src[i+2] === ' ' || src[i+2] === '>')) {
      depth++
      i += 2
    } else if (src.startsWith('</g>', i)) {
      depth--
      if (depth === 0) {
        endIdx = i + 4
        break
      }
      i += 4
    } else {
      i++
    }
  }
  if (endIdx === -1) continue
  avatarGroups.push({
    clipNum,
    content: src.slice(startIdx, endIdx),
  })
}

console.log(`Found ${avatarGroups.length} avatar groups`)

// Grid positions
const cols = [0, 184, 368, 552, 736, 920]
const rows = [0, 184, 368, 552, 736]

// Collect all referenced IDs from a group's content
function collectRefs(content) {
  const refs = new Set()
  // clip-path references
  for (const m of content.matchAll(/clip-path="url\(#([^)]+)\)"/g)) refs.add(m[1])
  // fill pattern references
  for (const m of content.matchAll(/fill="url\(#([^)]+)\)"/g)) refs.add(m[1])
  // xlink:href references
  for (const m of content.matchAll(/xlink:href="#([^"]+)"/g)) refs.add(m[1])
  return refs
}

// Extract a def by ID from the defs content
function extractDef(id, fullDefs) {
  // Try clipPath
  let re = new RegExp(`<clipPath id="${id}"[^>]*>[\\s\\S]*?<\\/clipPath>`)
  let m = fullDefs.match(re)
  if (m) return m[0]

  // Try pattern
  re = new RegExp(`<pattern id="${id}"[\\s\\S]*?<\\/pattern>`)
  m = fullDefs.match(re)
  if (m) return m[0]

  // Try linearGradient
  re = new RegExp(`<linearGradient id="${id}"[\\s\\S]*?<\\/linearGradient>`)
  m = fullDefs.match(re)
  if (m) return m[0]

  // Try image (self-closing or with content)
  re = new RegExp(`<image id="${id}"[^>]*\\/>`)
  m = fullDefs.match(re)
  if (m) return m[0]

  return null
}

// Recursively collect all defs needed
function collectAllDefs(content, fullDefs) {
  const needed = new Set()
  const queue = [...collectRefs(content)]

  while (queue.length > 0) {
    const id = queue.shift()
    if (needed.has(id)) continue
    needed.add(id)
    const def = extractDef(id, fullDefs)
    if (def) {
      // Check if this def references other defs
      for (const ref of collectRefs(def)) {
        if (!needed.has(ref)) queue.push(ref)
      }
    }
  }
  return needed
}

// Name avatars sequentially
const names = []
for (let r = 0; r < rows.length; r++) {
  for (let c = 0; c < cols.length; c++) {
    const idx = r * cols.length + c
    if (idx < avatarGroups.length) {
      names.push(`avatar-${String(idx + 1).padStart(2, '0')}`)
    }
  }
}

// Remove old placeholder SVGs
const oldFiles = readdirSync(outDir).filter(f => f.endsWith('.svg') && f !== 'full-set.svg')
for (const f of oldFiles) {
  unlinkSync(join(outDir, f))
  console.log(`Removed old: ${f}`)
}

// Generate individual SVGs
for (let i = 0; i < avatarGroups.length; i++) {
  const { content } = avatarGroups[i]
  const name = names[i] || `avatar-${i + 1}`
  const row = Math.floor(i / cols.length)
  const col = i % cols.length
  const tx = cols[col]
  const ty = rows[row]

  // Collect all needed defs
  const neededIds = collectAllDefs(content, defsContent)
  const defParts = []
  for (const id of neededIds) {
    const def = extractDef(id, defsContent)
    if (def) defParts.push(def)
  }

  // Build standalone SVG with translation to move avatar to origin
  const svg = `<svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<defs>
${defParts.join('\n')}
</defs>
<g transform="translate(${-tx}, ${-ty})">
${content}
</g>
</svg>`

  writeFileSync(join(outDir, `${name}.svg`), svg)
  console.log(`Created: ${name}.svg`)
}

console.log(`\nDone! ${avatarGroups.length} avatars extracted.`)
