import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

// Interface para o payload do JWT
interface JwtPayload {
  userId: string
  email: string
}

// Estender a interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Token de acesso requerido" })
    }

    const jwtSecret = process.env.JWT_SECRET || "your-secret-key"
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

    req.user = decoded
    next()
  } catch (error) {
    console.error("Erro na autenticação:", error)
    res.status(401).json({ error: "Token inválido" })
  }
}
