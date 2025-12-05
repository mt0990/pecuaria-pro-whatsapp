import { sendMessage } from "../services/whatsapp.js";
import {
    createLoteDB,
    listLotesDB,
    addAnimalToLoteDB,
    removeAnimalFromLoteDB,
    deleteLoteDB
} from "../database/database.js";

import supabase from "../database/supabase.js"; // usado apenas para consultas diretas
import { logError } from "../utils/logger.js";


// ======================================================
// 📦 Criar Lote
// ======================================================
export async function criarLote(phone, nomeLote) {
    try {
        if (!nomeLote || nomeLote.length < 2) {
            return sendMessage(phone, "⚠️ Nome do lote inválido. Use: criar lote nome_do_lote");
        }

        // Verifica duplicidade
        const { data: existente } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .single();

        if (existente) {
            return sendMessage(phone, `⚠️ O lote *${nomeLote}* já existe.`);
        }

        // Cria via database.js
        await createLoteDB(phone, nomeLote);

        return sendMessage(phone, `📦 Lote *${nomeLote}* criado com sucesso!`);

    } catch (err) {
        logError(err, { section: "criarLote", phone });
        return sendMessage(phone, "❌ Erro ao criar lote. Tente novamente.");
    }
}



// ======================================================
// 📋 Listar lotes
// ======================================================
export async function listarLotes(phone) {
    try {
        const lotes = await listLotesDB(phone);

        if (lotes.length === 0) {
            return sendMessage(phone, "📭 Você ainda não tem lotes cadastrados.");
        }

        let texto = "📦 *SEUS LOTES:*\n\n";

        lotes.forEach(lote => {
            texto += `• ID: ${lote.id}\n  Nome: ${lote.nome}\n-----------------------\n`;
        });

        return sendMessage(phone, texto);

    } catch (err) {
        logError(err, { section: "listarLotes", phone });
        return sendMessage(phone, "❌ Erro ao listar os lotes.");
    }
}



// ======================================================
// 🐮 Adicionar Animal ao Lote
// ======================================================
export async function adicionarAoLote(phone, nomeLote, animalId) {
    try {
        if (!nomeLote || !animalId) {
            return sendMessage(phone, "⚠️ Use: adicionar ao lote nome_do_lote id_do_animal");
        }

        // Busca lote
        const { data: lote } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .single();

        if (!lote) {
            return sendMessage(phone, `❌ Lote *${nomeLote}* não encontrado.`);
        }

        // Busca animal
        const { data: animal } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone)
            .eq("id", animalId)
            .single();

        if (!animal) {
            return sendMessage(phone, `❌ Animal com ID *${animalId}* não encontrado.`);
        }

        // Verifica duplicidade
        const { data: existe } = await supabase
            .from("lote_animais")
            .select("*")
            .eq("lote_id", lote.id)
            .eq("animal_id", animalId)
            .single();

        if (existe) {
            return sendMessage(phone, `⚠️ O animal já está no lote *${nomeLote}*.`);
        }

        // Adiciona via database.js
        await addAnimalToLoteDB(phone, lote.id, animalId);

        return sendMessage(
            phone,
            `🐮 Animal *${animal.nome}* (ID ${animalId}) adicionado ao lote *${nomeLote}*.`
        );

    } catch (err) {
        logError(err, { section: "adicionarAoLote", phone });
        return sendMessage(phone, "❌ Erro ao adicionar animal ao lote.");
    }
}



// ======================================================
// ❌ Remover Animal do Lote
// ======================================================
export async function removerDoLote(phone, nomeLote, animalId) {
    try {
        if (!nomeLote || !animalId) {
            return sendMessage(phone, "⚠️ Use: remover do lote nome_do_lote id_do_animal");
        }

        // Busca lote
        const { data: lote } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .single();

        if (!lote) {
            return sendMessage(phone, `❌ Lote *${nomeLote}* não encontrado.`);
        }

        // Remove relação via database.js
        await removeAnimalFromLoteDB(phone, lote.id, animalId);

        return sendMessage(
            phone,
            `❌ Animal ID *${animalId}* removido do lote *${nomeLote}*.`
        );

    } catch (err) {
        logError(err, { section: "removerDoLote", phone });
        return sendMessage(phone, "❌ Erro ao remover animal do lote.");
    }
}



// ======================================================
// 🗑️ Deletar Lote
// ======================================================
export async function deletarLote(phone, nomeLote) {
    try {
        if (!nomeLote) {
            return sendMessage(phone, "⚠️ Use: remover lote nome_do_lote");
        }

        // Busca lote
        const { data: lote } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .single();

        if (!lote) {
            return sendMessage(phone, `❌ Lote *${nomeLote}* não encontrado.`);
        }

        // Remove via database.js
        await deleteLoteDB(phone, lote.id);

        return sendMessage(phone, `🗑️ Lote *${nomeLote}* deletado com sucesso.`);

    } catch (err) {
        logError(err, { section: "deletarLote", phone });
        return sendMessage(phone, "❌ Erro ao deletar lote.");
    }
}
