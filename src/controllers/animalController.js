import supabase from "../database/supabase.js";
import { logError } from "../utils/logger.js";

// ===============================
// 🧠 PARSE AUTOMÁTICO
// ===============================
function parseAnimalData(text) {
    text = text.replace(/registrar animal/i, "").trim();
    const partes = text.split(/\s+|\n/).filter(Boolean);

    const nome = partes[0] || "SemNome";
    const raca = partes[1] || "Desconhecida";

    const pesoMatch = text.match(/(\d{2,4})\s*(kg|quilo|kilo)?/i);
    const peso = pesoMatch ? Number(pesoMatch[1]) : null;

    const idadeMatch = text.match(/\d+\s*(ano|anos|m[eê]s|meses|dia|dias)/i);
    const idade = idadeMatch ? idadeMatch[0] : null;

    const notas = text
        .replace(nome, "")
        .replace(raca, "")
        .replace(pesoMatch?.[0] || "", "")
        .replace(idadeMatch?.[0] || "", "")
        .trim();

    return { nome, raca, peso, idade, notas };
}

// ===============================
// ➕ Registrar
// ===============================
export async function registrarAnimal(phone, msg) {
    try {
        const { nome, raca, peso, idade, notas } = parseAnimalData(msg);

        const { error } = await supabase
            .from("animals")
            .insert([{ phone, nome, raca, peso, idade, notas }]);

        if (error) throw error;

        return "✅ *Animal registrado com sucesso!*";

    } catch (err) {
        logError(err, { local: "registrarAnimal", phone });
        return "❌ *Erro ao registrar animal. Verifique os dados.*";
    }
}

// ===============================
// 📋 Listar
// ===============================
export async function listarAnimais(phone) {
    try {
        const { data, error } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: true });

        if (error) throw error;

        if (!data.length) {
            return "📭 *Você ainda não tem animais cadastrados.*";
        }

        // proteção simples contra mensagens enormes
        if (data.length > 30) {
            return `📋 Você possui *${data.length}* animais cadastrados.\n\nDigite *listar animais 1* para ver os primeiros.`;
        }

        let texto = "🐮 *SEUS ANIMAIS:*\n\n";

        for (const a of data) {
            texto +=
                `ID: ${a.id}\n` +
                `Nome: ${a.nome}\n` +
                `Raça: ${a.raca}\n` +
                `Peso: ${a.peso || "—"} kg\n` +
                `Idade: ${a.idade || "—"}\n` +
                `Notas: ${a.notas || "—"}\n` +
                "---------------------\n";
        }

        return texto;

    } catch (err) {
        logError(err, { local: "listarAnimais", phone });
        return "❌ *Erro ao listar animais.*";
    }
}

// ===============================
// ✏️ Editar
// ===============================
export async function editarAnimal(phone, msg) {
    try {
        const linhas = msg.split("\n").map(l => l.trim()).filter(Boolean);

        const idMatch = linhas[0]?.match(/\d+/);
        const id = idMatch ? Number(idMatch[0]) : null;

        if (!id) {
            return "⚠️ Formato inválido!\n\nUse:\neditar animal ID\nNome\nRaça\nPeso\nIdade\nNotas";
        }

        const campos = {};

        if (linhas[1]) campos.nome = linhas[1];
        if (linhas[2]) campos.raca = linhas[2];
        if (linhas[3]) campos.peso = Number(linhas[3].replace(/\D/g, ""));
        if (linhas[4]) campos.idade = linhas[4];
        if (linhas[5]) campos.notas = linhas.slice(5).join(" ");

        if (!Object.keys(campos).length) {
            return "⚠️ Nenhuma informação enviada para atualizar.";
        }

        const { error } = await supabase
            .from("animals")
            .update(campos)
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

        return `✅ Animal *${id}* atualizado com sucesso!`;

    } catch (err) {
        logError(err, { local: "editarAnimal", phone });
        return "❌ Erro ao editar animal.";
    }
}

// ===============================
// ❌ Remover
// ===============================
export async function removerAnimal(phone, msg) {
    try {
        const idMatch = msg.match(/\d+/);
        const id = idMatch ? Number(idMatch[0]) : null;

        if (!id) return "❌ Envie: remover animal ID";

        const { error } = await supabase
            .from("animals")
            .delete()
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

        return `🗑️ *Animal ${id} removido!*`;

    } catch (err) {
        logError(err, { local: "removerAnimal", phone });
        return "❌ Erro ao remover animal.";
    }
}
