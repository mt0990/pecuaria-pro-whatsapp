import express from "express";
import { processIncomingMessage } from "../services/whatsapp.js";

const router = express.Router();

router.get("/", (req, res) => res.send("Webhook OK"));

router.post("/", async (req, res) => {
    res.sendStatus(200);
    await processIncomingMessage(req.body);
});

export default router;
