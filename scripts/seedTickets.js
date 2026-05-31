// scripts/seedTickets.js
// Inserta 1000+ tickets de prueba usando fetch nativo (Node 18+)
// Uso: node scripts/seedTickets.js
//   o: npm run seed:tickets

const API_URL = process.env.VITE_API_URL ?? 'https://mi-boleta-api-y9dv.onrender.com/api/v1'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@miboleta.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Password123!'
const TOTAL = Number(process.env.SEED_TOTAL) || 1050
const BATCH_SIZE = Number(process.env.SEED_CONCURRENCY) || 8
const DELAY_MS = 150

const GAME_TYPES = ['Lotería', 'Rifa', 'Sorteo', 'Boleta', 'Juego ocasional']
const TICKET_STATUSES = ['Pendiente', 'Ganado', 'Perdido']

const PLACES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Cúcuta',
  'Ibagué', 'Villavicencio', 'Pasto', 'Neiva', 'Armenia',
]

const TITLE_WORDS = [
  'Gran', 'Suerte', 'Especial', 'Dorado', 'Mágico', 'Plateado',
  'Sorteo', 'Super', 'Mega', 'Premio', 'Nacional', 'Regional',
]

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate() {
  // Fechas entre 2 años atrás y hoy
  const daysAgo = randInt(0, 365 * 2)
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return d.toISOString().split('T')[0]
}

function generateTicket(index) {
  const status = randItem(TICKET_STATUSES)
  const gameType = randItem(GAME_TYPES)
  return {
    title: `${randItem(TITLE_WORDS)} ${randItem(TITLE_WORDS)} #${index}`,
    gameType,
    gameNumber: String(randInt(1000, 99999)),
    gameDate: randomDate(),
    amount: randInt(1000, 500000),
    place: randItem(PLACES),
    status,
    notes: Math.random() > 0.6
      ? `Boleta de prueba – ${gameType} – ${status}`
      : undefined,
  }
}

async function login() {
  console.log(`\n🔑  Autenticando como ${ADMIN_EMAIL}…`)
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(`Login falló (${res.status}): ${JSON.stringify(json)}`)
  }

  // Intentar extraer token de distintas estructuras posibles
  const token =
    json?.data?.token ??
    json?.token ??
    json?.access_token ??
    json?.data?.access_token

  if (!token) {
    throw new Error(`No se encontró token en la respuesta: ${JSON.stringify(json)}`)
  }

  console.log('✅  Login exitoso.\n')
  return token
}

async function postTicket(token, payload, idx) {
  const res = await fetch(`${API_URL}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} en ticket ${idx}: ${body.slice(0, 200)}`)
  }

  return res.json()
}

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function seed() {
  // ── Login ─────────────────────────────────────────────────────
  let token
  try {
    token = await login()
  } catch (err) {
    console.error('❌  Error de autenticación:', err.message)
    process.exit(1)
  }

  // ── Seed en lotes ─────────────────────────────────────────────
  console.log(`🚀  Insertando ${TOTAL} tickets (lotes de ${BATCH_SIZE})…\n`)

  let ok = 0
  let fail = 0

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const end = Math.min(i + BATCH_SIZE, TOTAL)
    const batch = []

    for (let j = i; j < end; j++) {
      const idx = j + 1
      batch.push(
        postTicket(token, generateTicket(idx), idx)
          .then(() => { ok++ })
          .catch((err) => {
            fail++
            if (fail <= 5) console.warn(`  ⚠️  ${err.message}`)
          }),
      )
    }

    await Promise.all(batch)

    const pct = Math.round((end / TOTAL) * 100)
    process.stdout.write(
      `\r  Progreso: ${end}/${TOTAL} (${pct}%)  ✅ ${ok} ok  ❌ ${fail} errores   `,
    )

    if (end < TOTAL) await delay(DELAY_MS)
  }

  console.log(`\n\n✨  Seed completado:`)
  console.log(`   ✅  Tickets insertados: ${ok}`)
  console.log(`   ❌  Errores:            ${fail}`)
  console.log(`\n🎯  Recarga la vista admin en el navegador para ver los registros nuevos.\n`)
}

seed()
