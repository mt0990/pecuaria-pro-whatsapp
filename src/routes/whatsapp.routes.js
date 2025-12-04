import { Router } from "express";
import { handleIncoming } from "../controllers/whatsappController.js";

const router = Router();

router.post("/", handleIncoming);

export default router;
