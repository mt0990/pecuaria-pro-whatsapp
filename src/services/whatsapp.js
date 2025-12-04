import axios from "axios";
import { config } from "../config/env.js";

export async function sendMessage(phone, body) {
    const url = `https://api.ultramsg.com/${config.ULTRA_INSTANCE}/messages/chat`;

    await axios.post(url, {
        token: config.ULTRA_TOKEN,
        to: phone,
        body
    });
}
