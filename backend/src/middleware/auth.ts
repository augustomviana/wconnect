import * as jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import type { CustomJwtPayload } from "../types/express"

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Token de acesso requerido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as CustomJwtPayload

    // Garantir que o token decodificado tem as propriedades necessárias
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ error: "Token inválido" })
    }

    req.user = decoded
    next()
  } catch (error) {
    console.error("Erro na autenticação:", error)
    res.status(401).json({ error: "Token inválido" })
  }
}
