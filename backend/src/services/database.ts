// backend/src/services/database.ts

import { Pool, type QueryResult } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// --- INTERFACES COMPLETAS ---
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Contact {
  id: string;
  whatsapp_id: string;
  name: string;
  phone_number?: string;
  profile_pic_url?: string;
  is_group?: boolean;
  is_blocked?: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface Message {
  id: string;
  whatsapp_id: string;
  from_contact: string;
  to_contact: string;
  message_body: string;
  message_type: string;
  timestamp: Date;
  is_group_message: boolean;
  created_at: Date;
  from_name?: string;
  to_name?: string;
}

// --- CLASSE COMPLETA ---
export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || "whatsapp_user",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "whatsapp_web",
      password: process.env.DB_PASSWORD || "sua_senha",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async query(text: string, params?: any[]): Promise<QueryResult<any>> {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query", { text: text.trim().replace(/\s+/g, ' '), duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  async testConnection(): Promise<void> {
    try {
      await this.query("SELECT 1");
      console.log("✅ Conexão com banco de dados testada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao testar conexão com banco:", error);
      throw error;
    }
  }

  // --- MÉTODOS DE UTILIZADOR RESTAURADOS ---
  async createUser(userData: Pick<User, "name" | "email" | "password_hash">): Promise<User> {
    const { name, email, password_hash } = userData;
    const queryText = `INSERT INTO users (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, password_hash, created_at`;
    const result = await this.query(queryText, [name, email, password_hash]);
    return result.rows[0] as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const queryText = "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1";
    const result = await this.query(queryText, [email]);
    return result.rows.length > 0 ? result.rows[0] as User : null;
  }

  async getUserById(id: string): Promise<User | null> {
    const queryText = "SELECT id, name, email, password_hash, created_at FROM users WHERE id = $1";
    const result = await this.query(queryText, [id]);
    return result.rows.length > 0 ? result.rows[0] as User : null;
  }

  // --- MÉTODOS DE CONTACTO RESTAURADOS ---
  async saveContact(contactData: Partial<Contact>): Promise<Contact> {
    const { whatsapp_id, name, phone_number, profile_pic_url, is_group, is_blocked } = contactData;
    let insertCols = "whatsapp_id, name, created_at";
    let insertValues = "$1, $2, NOW()";
    let conflictUpdates = "name = EXCLUDED.name, updated_at = NOW()";
    const queryParams: any[] = [whatsapp_id, name];

    if (phone_number !== undefined) {
        insertCols += ", phone_number";
        insertValues += `, $${queryParams.length + 1}`;
        conflictUpdates += `, phone_number = EXCLUDED.phone_number`;
        queryParams.push(phone_number);
    }
    // ... (lógica para outros campos opcionais)

    const queryText = `INSERT INTO contacts (${insertCols}) VALUES (${insertValues}) ON CONFLICT (whatsapp_id) DO UPDATE SET ${conflictUpdates} RETURNING *`;
    const result = await this.query(queryText, queryParams);
    return result.rows[0] as Contact;
  }

  async getContacts(limit = 50, offset = 0): Promise<Contact[]> {
    const queryText = `SELECT * FROM contacts ORDER BY name ASC LIMIT $1 OFFSET $2`;
    const result = await this.query(queryText, [limit, offset]);
    return result.rows as Contact[];
  }

  // ... (seus outros métodos, como saveMessage, getMessages, getStats)
}
