import { Pool, type QueryResult } from "pg" // Import QueryResult
import * as dotenv from "dotenv"

dotenv.config()

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  created_at: Date
}

export interface Contact {
  id: string
  whatsapp_id: string
  name: string
  phone_number?: string
  profile_pic_url?: string
  is_group?: boolean
  is_blocked?: boolean // <<--- PROPRIEDADE ADICIONADA AQUI
  created_at: Date
  updated_at?: Date
}

export interface Message {
  id: string
  whatsapp_id: string
  from_contact: string
  to_contact: string
  message_body: string
  message_type: string
  timestamp: Date
  is_group_message: boolean
  created_at: Date
  from_name?: string
  to_name?: string
}

export class DatabaseService {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || "whatsapp_user",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "whatsapp_web",
      password: process.env.DB_PASSWORD || "sua_senha",
      port: Number.parseInt(process.env.DB_PORT || "5432"), // Mantido parseInt pois é para configuração da Pool
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  async query(text: string, params?: any[]): Promise<QueryResult<any>> {
    const start = Date.now()
    try {
      const res = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log("Executed query", { text, duration, rows: res.rowCount })
      return res
    } catch (error) {
      console.error("Database query error:", error)
      throw error
    }
  }

  async getClient() {
    return this.pool.connect()
  }

  async close() {
    await this.pool.end()
  }

  // Método para testar conexão
  async testConnection(): Promise<void> {
    try {
      await this.query("SELECT 1")
      console.log("✅ Conexão com banco de dados testada com sucesso")
    } catch (error) {
      console.error("❌ Erro ao testar conexão com banco:", error)
      throw error
    }
  }

  // User methods
  async createUser(userData: Pick<User, "name" | "email" | "password_hash">): Promise<User> {
    const { name, email, password_hash } = userData
    const queryText = `
      INSERT INTO users (name, email, password_hash, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, name, email, password_hash, created_at 
    `
    const result = await this.query(queryText, [name, email, password_hash])
    return result.rows[0] as User
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const queryText = "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1"
    const result = await this.query(queryText, [email])
    if (result.rows.length > 0) {
      return result.rows[0] as User
    }
    return null
  }

  async getUserById(id: string): Promise<User | null> {
    const queryText = "SELECT id, name, email, password_hash, created_at FROM users WHERE id = $1"
    const result = await this.query(queryText, [id])
    if (result.rows.length > 0) {
      return result.rows[0] as User
    }
    return null
  }

  // Contact methods
  async saveContact(contactData: Partial<Contact>): Promise<Contact> {
    const { whatsapp_id, name, phone_number, profile_pic_url, is_group, is_blocked } = contactData

    let insertCols = "whatsapp_id, name, created_at"
    let insertValues = "$1, $2, NOW()"
    let conflictUpdates = "name = EXCLUDED.name, updated_at = NOW()"
    const queryParams: any[] = [whatsapp_id, name]

    if (phone_number !== undefined) {
      insertCols += ", phone_number"
      insertValues += `, $${queryParams.length + 1}`
      conflictUpdates += `, phone_number = EXCLUDED.phone_number`
      queryParams.push(phone_number)
    }
    if (profile_pic_url !== undefined) {
      insertCols += ", profile_pic_url"
      insertValues += `, $${queryParams.length + 1}`
      conflictUpdates += `, profile_pic_url = EXCLUDED.profile_pic_url`
      queryParams.push(profile_pic_url)
    }
    if (is_group !== undefined) {
      insertCols += ", is_group"
      insertValues += `, $${queryParams.length + 1}`
      conflictUpdates += `, is_group = EXCLUDED.is_group`
      queryParams.push(is_group)
    }
    if (is_blocked !== undefined) {
      insertCols += ", is_blocked"
      insertValues += `, $${queryParams.length + 1}`
      conflictUpdates += `, is_blocked = EXCLUDED.is_blocked`
      queryParams.push(is_blocked)
    }

    const queryText = `
      INSERT INTO contacts (${insertCols})
      VALUES (${insertValues})
      ON CONFLICT (whatsapp_id) 
      DO UPDATE SET ${conflictUpdates}
      RETURNING *
    `

    const result = await this.query(queryText, queryParams)
    return result.rows[0] as Contact
  }

  async getContacts(limit = 50, offset = 0): Promise<Contact[]> {
    // Se 'is_group' e 'is_blocked' são colunas no banco, elas serão selecionadas com SELECT *
    const queryText = `
      SELECT * FROM contacts 
      ORDER BY name ASC 
      LIMIT $1 OFFSET $2
    `
    const result = await this.query(queryText, [limit, offset])
    return result.rows as Contact[]
  }

  // Message methods
  async saveMessage(messageData: Omit<Message, "id" | "created_at" | "from_name" | "to_name">): Promise<Message> {
    const { whatsapp_id, from_contact, to_contact, message_body, message_type, timestamp, is_group_message } =
      messageData

    const queryText = `
      INSERT INTO messages (
        whatsapp_id, from_contact, to_contact, message_body, 
        message_type, timestamp, is_group_message, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING * `
    const result = await this.query(queryText, [
      whatsapp_id,
      from_contact,
      to_contact,
      message_body,
      message_type,
      timestamp,
      is_group_message,
    ])
    return result.rows[0] as Message
  }

  async getMessages(contactId?: string, limit = 50, offset = 0): Promise<Message[]> {
    let queryText = `
      SELECT m.*, 
             c1.name as from_name,
             c2.name as to_name
      FROM messages m
      LEFT JOIN contacts c1 ON m.from_contact = c1.whatsapp_id
      LEFT JOIN contacts c2 ON m.to_contact = c2.whatsapp_id
    `
    const params: any[] = []

    if (contactId) {
      queryText += ` WHERE m.from_contact = $${params.length + 1} OR m.to_contact = $${params.length + 1}`
      params.push(contactId)
    }

    queryText += ` ORDER BY m.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await this.query(queryText, params)
    return result.rows as Message[]
  }

  // Stats methods
  async getStats(): Promise<{ totalMessages: number; totalContacts: number; messagesToday: number }> {
    const queries = [
      "SELECT COUNT(*) as total_messages FROM messages",
      "SELECT COUNT(*) as total_contacts FROM contacts",
      "SELECT COUNT(*) as messages_today FROM messages WHERE DATE(created_at) = CURRENT_DATE",
    ]

    const results = await Promise.all(queries.map((q) => this.query(q)))

    return {
      totalMessages: Number(results[0].rows[0].total_messages),
      totalContacts: Number(results[1].rows[0].total_contacts),
      messagesToday: Number(results[2].rows[0].messages_today),
    }
  }
}
