import type { JwtPayload } from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload
    }
  }
}

export interface CustomJwtPayload extends JwtPayload {
  id: string
  email: string
  name: string
}

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
}
