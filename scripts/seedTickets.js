import axios from 'axios'

const GAME_TYPES = ['Lotería', 'Rifa', 'Sorteo', 'Boleta', 'Juego ocasional']
const TICKET_STATUSES = ['Pendiente', 'Ganado', 'Perdido']

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomTitle(i) {
  const words = ['Gran', 'Suerte', 'Noche', 'Especial', 'Sorteo', 'Super']
  return `${randItem(words)} ticket #${i}`
}

function randomDate() {
  const daysAgo = randInt(0, 365 * 2)
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return d.toISOString()
}

function randomPlace() {
  const places = ['Sala 1', 'Local Centro', 'Plaza Norte', 'Auditorio', 'Online']
  return randItem(places)
}

async function createTicket(client, payload) {
  const resp = await client.post('/tickets', payload)
  return resp.data
}

async function main() {
  const baseURL = process.env.VITE_API_URL || 'https://mi-boleta-api-y9dv.onrender.com/api/v1'
  let token = process.env.SEED_ADMIN_TOKEN || ''
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })

  async function login(email, password) {
    try {
      const resp = await client.post('/auth/login', { email, password })
      const tokenFromResp = resp?.data?.data?.token || resp?.data?.token
      if (!tokenFromResp) {
        throw new Error('No se obtuvo token en el login')
      }
      console.log('Obtenido token para', email)
      return tokenFromResp
    } catch (err) {
      throw new Error('Login fallido: ' + (err?.message || String(err)))
    }
  }

  async function registerAndLogin() {
    const name = `seed user ${Date.now()}`
    const email = `seeduser+${Date.now()}@example.com`
    const password = `SeedPass!${randInt(1000, 9999)}`

    try {
      await client.post('/auth/register', { name, email, password })
      console.log('Usuario registrado:', email)
    } catch (err) {
      console.log('Registro (posible duplicado) ignorado')
    }

    return login(email, password)
  }

  if (!token) {
    if (adminEmail && adminPassword) {
      try {
        token = await login(adminEmail, adminPassword)
      } catch (err) {
        console.error('Login con credenciales admin fallido:', err?.message || err)
        process.exit(1)
      }
    } else {
      try {
        token = await registerAndLogin()
      } catch (err) {
        console.error('No se pudo obtener token automático:', err?.message || err)
        console.error('Pasa SEED_ADMIN_TOKEN o SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD para intentar de nuevo')
        process.exit(1)
      }
    }
  }

  // attach token to client
  client.defaults.headers.Authorization = `Bearer ${token}`

  const total = Number(process.env.SEED_TOTAL) || 1000
  const concurrency = Number(process.env.SEED_CONCURRENCY) || 50

  console.log(`Seeding ${total} tickets to ${baseURL} (concurrency ${concurrency})`)

  const batches = []
  for (let i = 0; i < total; i += concurrency) {
    const batch = []
    for (let j = 0; j < concurrency && i + j < total; j++) {
      const idx = i + j + 1
      const payload = {
        title: randomTitle(idx),
        gameType: randItem(GAME_TYPES),
        gameNumber: `${randInt(1, 9999)}`,
        gameDate: randomDate(),
        amount: randInt(100, 10000),
        place: randomPlace(),
        status: randItem(TICKET_STATUSES),
        notes: Math.random() > 0.7 ? 'Generado por seed' : undefined,
      }

      batch.push(
        createTicket(client, payload)
          .then(() => ({ ok: true, idx }))
          .catch((err) => ({ ok: false, idx, error: err?.message || String(err) })),
      )
    }

    batches.push(Promise.all(batch))
  }

  let created = 0
  let failed = 0

  for (const b of batches) {
    // eslint-disable-next-line no-await-in-loop
    const results = await b
    for (const r of results) {
      if (r.ok) created++
      else failed++
    }
    console.log(`Progress: created=${created} failed=${failed}`)
  }

  console.log(`Done. created=${created} failed=${failed}`)
}

main().catch((err) => {
  console.error('Seeder failed:', err?.message || err)
  process.exit(1)
})
