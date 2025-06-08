const { Pool } = require("pg")

const pool = new Pool({
  user: "whatsapp_user",
  host: "localhost",
  database: "whatsapp_web",
  password: "rom@nos1",
  port: 5432,
})

async function testConnection() {
  try {
    const client = await pool.connect()
    console.log("✅ Conexão com PostgreSQL bem-sucedida!")

    const result = await client.query("SELECT NOW()")
    console.log("📅 Data/hora do servidor:", result.rows[0].now)

    // Testar se as tabelas existem
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log(
      "📋 Tabelas encontradas:",
      tables.rows.map((row) => row.table_name),
    )

    client.release()
    await pool.end()
  } catch (error) {
    console.error("❌ Erro na conexão:", error.message)
  }
}

testConnection()
