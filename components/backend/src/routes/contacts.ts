import express, { Request, Response } from "express"; // Importado Request e Response para melhor tipagem
import { DatabaseService, Contact } from "../services/database"; // Importada a interface Contact
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const dbService = new DatabaseService();

// Get all contacts (PROTEGIDO)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = req.query.search as string | undefined;

    const offset = (page - 1) * limit;
    let query = `
      SELECT * FROM contacts 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex})`; // Usar o mesmo placeholder para OR
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const contactsResult = await dbService.query(query, params);

    let countQuery = "SELECT COUNT(*) as count FROM contacts WHERE 1=1"; // Adicionado "as count"
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR phone_number ILIKE $${countParamIndex})`; // Usar o mesmo placeholder
      countParams.push(`%${search}%`);
    }
    const totalResult = await dbService.query(countQuery, countParams);
    const total = Number(totalResult.rows[0].count); // Usar Number() e acessar a propriedade 'count'

    res.json({
      contacts: contactsResult.rows as Contact[], // Cast para Contact[]
      pagination: {
        page: page,
        limit: limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get contact by DB ID (PROTEGIDO)
router.get("/id/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await dbService.query("SELECT * FROM contacts WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado" });
    }
    res.json({ contact: result.rows[0] as Contact }); // Cast para Contact
  } catch (error) {
    console.error("Erro ao buscar contato por DB ID:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
  // Bloco de código removido daqui pois estava fora de contexto e causaria erro.
  // O código abaixo era um exemplo para tratar 'contacts' indefinido em outra rota.
  // if (contacts) { 
  // console.log(`Obtidos ${contacts.length} contatos do WhatsApp`);
  // } else {
  // console.log("Nenhum contato foi obtido do WhatsApp ou a lista está indefinida.");
  // }
});

// Get contact by WhatsApp ID (PROTEGIDO) - NOVA ROTA
router.get("/whatsapp/:whatsappId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { whatsappId } = req.params;
    const result = await dbService.query("SELECT * FROM contacts WHERE whatsapp_id = $1", [whatsappId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado no banco de dados" });
    }
    res.json({ contact: result.rows[0] as Contact }); // Cast para Contact
  } catch (error) {
    console.error("Erro ao buscar contato por WhatsApp ID:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Create or update contact (PROTEGIDO)
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    // Tipando o corpo da requisição para maior segurança
    const { whatsapp_id, name, phone_number, profile_pic_url, is_group, is_blocked }: Partial<Contact> = req.body;
    
    if (!whatsapp_id) {
      return res.status(400).json({ error: "WhatsApp ID é obrigatório" });
    }
    // O nome é frequentemente essencial também, pode-se adicionar uma validação se necessário.
    // if (!name) {
    //   return res.status(400).json({ error: "Nome do contato é obrigatório" });
    // }

    const contactData: Partial<Contact> = { whatsapp_id };
    if (name !== undefined) contactData.name = name;
    if (phone_number !== undefined) contactData.phone_number = phone_number;
    if (profile_pic_url !== undefined) contactData.profile_pic_url = profile_pic_url;
    if (is_group !== undefined) contactData.is_group = is_group;
    if (is_blocked !== undefined) contactData.is_blocked = is_blocked;


    const contact = await dbService.saveContact(contactData);
    res.status(201).json({ message: "Contato salvo com sucesso", contact });
  } catch (error) {
    console.error("Erro ao salvar contato:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Update contact by DB ID (PROTEGIDO)
router.put("/id/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone_number, profile_pic_url, is_group, is_blocked }: Partial<Contact> = req.body;
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (phone_number !== undefined) {
      updateFields.push(`phone_number = $${paramIndex++}`);
      params.push(phone_number);
    }
    if (profile_pic_url !== undefined) {
      updateFields.push(`profile_pic_url = $${paramIndex++}`);
      params.push(profile_pic_url);
    }
    if (is_group !== undefined) { // Adicionado is_group para atualização
        updateFields.push(`is_group = $${paramIndex++}`);
        params.push(is_group);
    }
    if (is_blocked !== undefined) {
      updateFields.push(`is_blocked = $${paramIndex++}`);
      params.push(is_blocked);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }
    updateFields.push(`updated_at = NOW()`);
    
    params.push(id); // Adiciona o ID como último parâmetro para a cláusula WHERE
    const query = `UPDATE contacts SET ${updateFields.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await dbService.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado" });
    }
    res.json({ message: "Contato atualizado com sucesso", contact: result.rows[0] as Contact });
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Delete contact (PROTEGIDO)
router.delete("/id/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await dbService.query("DELETE FROM contacts WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contato não encontrado" });
    }
    res.json({ message: "Contato excluído com sucesso", contact: result.rows[0] as Contact }); // Retornar o contato excluído pode ser útil
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Get contact statistics (PÚBLICO)
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    const statsPromises = [
      dbService.query("SELECT COUNT(*) as total FROM contacts"),
      dbService.query("SELECT COUNT(*) as groups FROM contacts WHERE is_group = true"),
      dbService.query("SELECT COUNT(*) as blocked FROM contacts WHERE is_blocked = true"), // Agora is_blocked é reconhecido
      dbService.query("SELECT COUNT(*) as recent FROM contacts WHERE created_at >= NOW() - INTERVAL '7 days'"),
    ];
    const statsResults = await Promise.all(statsPromises);
    
    res.json({
      total: Number(statsResults[0].rows[0].total),
      groups: Number(statsResults[1].rows[0].groups),
      blocked: Number(statsResults[2].rows[0].blocked),
      recent: Number(statsResults[3].rows[0].recent),
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de contatos:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
