import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

export async function criarLote(phone, nome) {
    try {
        const { error } = await supabase
            .from("lotes")
            .insert([{ phone, nome }]);

        if (error) throw error;

        return sendMessage(phone, `📦 Lote '${nome}' criado com sucesso!`);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao criar lote.");
    }
}

export async function adicionarAoLote(phone, lote, animalId) {
    try {
        const { data, error: loteError } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", lote)
            .single();

        if (loteError || !data) {
            return sendMessage(phone, "❌ Lote não encontrado.");
        }

        const { error } = await supabase
            .from("lotes_animais")
            .insert([{ lote_id: data.id, animal_id: Number(animalId) }]);

        if (error) throw error;

        return sendMessage(phone, "🐮 Animal adicionado ao lote!");

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao adicionar animal ao lote.");
    }
}

export async function listarLotes(phone) {
    try {
        const { data, error } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone);

        if (error) throw error;

        if (!data.length) {
            return sendMessage(phone, "📭 Nenhum lote criado ainda.");
        }

        let texto = "📦 *SEUS LOTES:*\n\n";
        data.forEach(l => texto += `- ${l.nome}\n`);

        return sendMessage(phone, texto);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao listar lotes.");
    }
}
