/**
 * Fetches LEGO set dimensions and images from the Brickset API v3.
 *
 * Usage:
 *   BRICKSET_API_KEY=your_key node scripts/fetchBricksetData.mjs
 *
 * Outputs:
 *   - Updated src/data/displayModels.ts with imageUrl fields
 *   - Images saved to public/textures/sets/{id}.jpg
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const IMAGES_DIR = join(ROOT, 'public/textures/sets')
const API_KEY = process.env.BRICKSET_API_KEY

if (!API_KEY) {
  console.error('Error: BRICKSET_API_KEY environment variable is not set.')
  console.error('Usage: BRICKSET_API_KEY=your_key node scripts/fetchBricksetData.mjs')
  process.exit(1)
}

if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true })
  console.log(`Created ${IMAGES_DIR}`)
}

// All set IDs currently in displayModels.ts
const SET_IDS = [
  '10307', '10294', '75419', '10276', '75192', '75313', '71043', '10256', '75978', '10333',
  '10316', '75331', '75367', '76269', '71741', '10284', '10299', '10326', '10297', '10312',
  '10350', '10270', '10278', '10255', '10260', '10264', '10243', '10246', '10251', '75290',
  '75341', '75252', '76178', '10300', '10274', '10281', '10280', '42143', '42115', '42083',
  '42130', '42096', '42110', '42100', '42146', '42171', '42156', '42159', '21356', '21058',
  '21056', '21054', '21061', '21028', '21045', '21044', '21042', '21046', '21052', '71374',
  '71386', '43222', '43197', '43212', '10311', '10313', '10329', '10338', '10302', '10303',
  '10305', '75979', '75318', '75308', '75306', '75304', '75327', '76240', '76251', '76258',
  '21325', '21318', '21322', '21320', '21321', '21332', '21341', '21343', '21348', '75827',
  '10234', '75159', '76419', '76403', '10309', '10340', '75309', '43226', '76989', '21336',
]

/**
 * Fetch set data from Brickset API for a single set number.
 * @param {string} setId - The LEGO set number (e.g. "10307")
 * @returns {Promise<object|null>}
 */
async function fetchSet(setId) {
  const params = JSON.stringify({ setNumber: `${setId}-1`, pageSize: 1 })
  const url = `https://brickset.com/api/v3.asmx/getSets?apiKey=${API_KEY}&userHash=&params=${encodeURIComponent(params)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for set ${setId}`)

  const data = await res.json()
  if (data.status !== 'success' || !data.sets?.length) return null
  return data.sets[0]
}

/**
 * Download an image URL to a local file path.
 * @param {string} imageUrl
 * @param {string} destPath
 */
async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Image download failed: HTTP ${res.status}`)
  const buffer = await res.arrayBuffer()
  writeFileSync(destPath, Buffer.from(buffer))
}

/** Sleep for ms milliseconds */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Round a dimension (cm) to meters with 2 decimal places.
 * Returns null if value is 0 or missing.
 */
function cmToM(val) {
  if (!val || val === 0) return null
  return Math.round(val) / 100
}

async function main() {
  console.log(`Fetching ${SET_IDS.length} sets from Brickset API...\n`)

  const results = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < SET_IDS.length; i++) {
    const id = SET_IDS[i]
    process.stdout.write(`[${i + 1}/${SET_IDS.length}] Set ${id}... `)

    try {
      const set = await fetchSet(id)

      if (!set) {
        console.log('NOT FOUND')
        results.push({ id, notFound: true })
        failCount++
        continue
      }

      const { name, modelDimensions, image } = set
      const heightM = cmToM(modelDimensions?.height)
      const widthM = cmToM(modelDimensions?.width)
      const depthM = cmToM(modelDimensions?.depth)

      // Download image
      let imageUrl = undefined
      if (image?.imageURL) {
        const ext = image.imageURL.split('.').pop().split('?')[0] || 'jpg'
        const localPath = join(IMAGES_DIR, `${id}.${ext}`)
        const webPath = `/textures/sets/${id}.${ext}`
        try {
          await downloadImage(image.imageURL, localPath)
          imageUrl = webPath
          process.stdout.write('img ✓ ')
        } catch (e) {
          process.stdout.write('img ✗ ')
        }
      }

      results.push({ id, name, heightM, widthM, depthM, imageUrl })
      console.log(`dims: ${heightM}m × ${widthM}m × ${depthM}m`)
      successCount++
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      results.push({ id, error: err.message })
      failCount++
    }

    // Rate limiting: 200ms between requests
    if (i < SET_IDS.length - 1) await sleep(200)
  }

  console.log(`\nDone: ${successCount} succeeded, ${failCount} failed\n`)

  // Generate updated displayModels.ts
  const lines = results.map(r => {
    if (r.notFound || r.error) {
      return `  // ${r.id}: ${r.error ?? 'not found in Brickset'}`
    }
    const imageField = r.imageUrl ? `, imageUrl: '${r.imageUrl}'` : ''
    const depthField = r.depthM !== null && r.depthM !== undefined
      ? `depthM: ${r.depthM}`
      : `depthM: null`
    return `  { id: '${r.id}', name: '${r.name?.replace(/'/g, "\\'")}', heightM: ${r.heightM}, widthM: ${r.widthM}, ${depthField}${imageField} },`
  })

  const output = `export type DisplayModel = {
  id: string
  name: string
  heightM: number
  widthM: number
  depthM: number | null
  imageUrl?: string
}

export const DISPLAY_MODELS: DisplayModel[] = [
${lines.join('\n')}
]

export const MODEL_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
]

export function modelColor(modelId: string): string {
  let sum = 0
  for (let i = 0; i < modelId.length; i++) {
    sum += modelId.charCodeAt(i)
  }
  const colorIndex = sum % MODEL_COLORS.length
  return MODEL_COLORS[colorIndex]
}
`

  const outPath = join(ROOT, 'src/data/displayModels.ts')
  writeFileSync(outPath, output)
  console.log(`Written: ${outPath}`)
  console.log(`Images:  ${IMAGES_DIR}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
