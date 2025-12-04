import { respostaGPT } from "../services/gpt.js";

export async function falarComGPT(phone, mensagem) {
    return await respostaGPT(phone, mensagem);
}
