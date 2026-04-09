import mysql from 'mysql2/promise'

const host = process.env.DB_HOST ?? '127.0.0.1'
const port = Number(process.env.DB_PORT ?? 3306)
const database = process.env.DB_NAME ?? 'campus_match'
const user = process.env.DB_USER ?? 'campus_match'
const password = process.env.DB_PASSWORD ?? 'campus_match_dev'

try {
  const connection = await mysql.createConnection({
    host,
    port,
    database,
    user,
    password,
  })

  const [rows] = await connection.query('SELECT 1 AS ok')
  console.log(
    JSON.stringify(
      {
        status: 'ok',
        host,
        port,
        database,
        rows,
      },
      null,
      2,
    ),
  )
  await connection.end()
} catch (error) {
  console.error(
    JSON.stringify(
      {
        status: 'error',
        host,
        port,
        database,
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
}
