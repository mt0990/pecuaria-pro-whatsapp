import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

// ======================================================
// MÓDULO DE LOTES — COMPLETO E FUNCIONAL
// ======================================================

// ------------------------------------------------------
// 1. Criar Lote
// ------------------------------------------------------
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

        const { error } = await supabase
            .from("lotes")
            .insert([
                {
                    phone,
                    nome: nomeLote,
                    criado_em: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        return sendMessage(phone, `📦 Lote *${nomeLote}* criado com sucesso!`);

    } catch (err) {
        console.error("Erro ao criar lote:", err);
        return sendMessage(phone, "❌ Erro ao criar lote. Tente novamente.");
    }
}

// ------------------------------------------------------
// 2. Listar Lotes
// ------------------------------------------------------
export async function listarLotes(phone) {
    try {
        const { data, error } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            return sendMessage(phone, "📭 Você ainda não tem lotes cadastrados.");
        }

        let texto = "📦 *SEUS LOTES:*\n\n";

        data.forEach(lote => {
            texto += `• ID: ${lote.id}\n  Nome: ${lote.nome}\n-----------------------\n`;
        });

        return sendMessage(phone, texto);

    } catch (err) {
        console.error("Erro ao listar lotes:", err);
        return sendMessage(phone, "❌ Erro ao listar os lotes.");
    }
}

// ------------------------------------------------------
// 3. Adicionar Animal ao Lote
// ------------------------------------------------------
export async function adicionarAoLote(phone, nomeLote, animalId) {
    try {
        if (!nomeLote || !animalId) {
            return sendMessage(phone, "⚠️ Use: adicionar ao lote nome_do_lote id_do_animal");
        }

        // Verifica se lote existe
        const { data: lote } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .single();

        if (!lote) {
            return sendMessage(phone, `❌ Lote *${nomeLote}* não encontrado.`);
        }

        // Verifica se animal existe
        const { data: animal } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone)
            .eq("id", animalId)
            .single();

        if (!animal) {
            return sendMessage(phone, `❌ Animal com ID *${animalId}* não encontrado.`);
        }

        // Verifica se já está no lote
        const { data: existe } = await supabase
            .from("lote_animais")
            .select("*")
            .eq("lote_id", lote.id)
            .eq("animal_id", animalId)
            .single();

        if (existe) {
            return sendMessage(phone, `⚠️ O animal já está no lote *${nomeLote}*.`);
        }

        // Insere no lote
        const { error } = await supabase
            .from("lote_animais")
            .insert([
                {
                    phone,
                    lote_id: lote.id,
                    animal_id: animalId
                }
            ]);

        if (error) throw error;

        return sendMessage(
            phone,
            `🐮 Animal *${animal.nome}* (ID ${animalId}) adicionado ao lote *${nomeLote}*.`
        );

    } catch (err) {
        console.error("Erro ao adicionar animal ao lote:", err);
        return sendMessage(phone, "❌ Erro ao adicionar animal ao lote.");
    }
}

// ------------------------------------------------------
// 4. Remover Animal do Lote
// ------------------------------------------------------
export async function removerDoLote(phone, nomeLote, animalId) {
    try {
        if (!nomeLote || !animalId) {
            return sendMessage(phone, "⚠️ Use: remover do lote nome_do_lote id_do_animal");
        }

        // Verifica lote
        const { data: lote } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .single();

        if (!lote) {
            return sendMessage(phone, `❌ Lote *${nomeLote}* não encontrado.`);
        }

        // Remove relação
        const { error } = await supabase
            .from("lote_animais")
            .delete()
            .eq("lote_id", lote.id)
            .eq("animal_id", animalId);

        if (error) throw error;

        return sendMessage(
            phone,
            `❌ Animal ID *${animalId}* removido do lote *${nomeLote}*.`
        );

    } catch (err) {
        console.error("Erro ao remover animal do lote:", err);
        return sendMessage(phone, "❌ Erro ao remover animal do lote.");
    }
}

// ------------------------------------------------------
// 5. Deletar Lote
// ------------------------------------------------------
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

        // Apaga animais do lote
        await supabase
            .from("lote_animais")
            .delete()
            .eq("lote_id", lote.id);

        // Apaga lote
        const { error } = await supabase
            .from("lotes")
            .delete()
            .eq("id", lote.id);

        if (error) throw error;

        return sendMessage(phone, `🗑️ Lote *${nomeLote}* deletado com sucesso.`);

    } catch (err) {
        console.error("Erro ao deletar lote:", err);
        return sendMessage(phone, "❌ Erro ao deletar lote.");
    }
}
