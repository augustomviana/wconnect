import express from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken"; // SignOptions pode ser mantida para referência futura.
import { DatabaseService } from "../services/database";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();
const dbService = new DatabaseService();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Nome, email e senha são obrigatórios",
      });
    }

    // Check if user already exists
    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: "Usuário já existe com este email",
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await dbService.createUser({
      name,
      email,
      password_hash: passwordHash,
    });

    // Generate JWT token with options
    const payload = { userId: user.id, email: user.email };
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET não está definido nas variáveis de ambiente.");
        return res.status(500).json({
            error: "Erro de configuração interna do servidor.",
        });
    }

    // CORREÇÃO APLICADA AQUI para o erro TS2769:
    // Usar 'as any' para a propriedade expiresIn para contornar a incompatibilidade de tipo
    // entre 'string' e 'StringValue' da biblioteca jsonwebtoken.
    // Isso assume que process.env.JWT_EXPIRES_IN (ou "7d") é uma string de tempo válida.
    const token = jwt.sign(
        payload,
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any } 
    );

    res.status(201).json({
      message: "Usuário criado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios",
      });
    }

    // Find user
    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Check if password matches
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Generate JWT token with options
    const payload = { userId: user.id, email: user.email };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET não está definido nas variáveis de ambiente.");
        return res.status(500).json({
            error: "Erro de configuração interna do servidor.",
        });
    }

    // CORREÇÃO APLICADA AQUI para o erro TS2769:
    const token = jwt.sign(
        payload,
        secret,
        { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any }
    );

    res.status(200).json({
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

// Rota /me para verificar o token e retornar dados do usuário
router.get("/me", authMiddleware, async (req: any, res) => { 
  try {
    const userId = req.user?.userId; 

    if (!userId) {
        return res.status(401).json({ error: "Token inválido ou usuário não encontrado." });
    }

    // LEMBRETE: Você precisará criar o método 'getUserById' na sua classe DatabaseService.
    // Ex: public async getUserById(id: string): Promise<User | null> { ... }
    const user = await dbService.getUserById(userId); 

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});


// Logout (opcional - o logout no JWT geralmente é feito no lado do cliente invalidando o token)
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      message: "Logout realizado com sucesso (token invalidado no cliente)",
    });
  } catch (error) {
    console.error("Erro no logout:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
});

export default router;
