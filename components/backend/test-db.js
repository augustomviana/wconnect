// Teste simples de conexão com o banco de dados
const { Pool } = require("pg")
require("dotenv").config()

const pool = new Pool({
  user: process.env.DB_USER || "whatsapp_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "whatsapp_web",
  password: process.env.DB_PASSWORD || "whatsapp_password",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
})

async function testConnection() {
  console.log("Testando conexão com o banco de dados...")
  console.log(`Host: ${process.env.DB_HOST || "localhost"}`)
  console.log(`Database: ${process.env.DB_NAME || "whatsapp_web"}`)
  console.log(`User: ${process.env.DB_USER || "whatsapp_user"}`)

  try {
    const res = await pool.query("SELECT NOW() as time")
    console.log("✅ Conexão bem-sucedida!")
    console.log(`⏰ Hora do servidor: ${res.rows[0].time}`)
    return true
  } catch (err) {
    console.error("❌ Erro na conexão:", err.message)
    return false
  } finally {
    await pool.end()
  }
}

testConnection()
