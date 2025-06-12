import { Router, type Request, type Response } from "express"

const router = Router()

router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "WhatsApp Web System Backend",
  })
})

export default router
