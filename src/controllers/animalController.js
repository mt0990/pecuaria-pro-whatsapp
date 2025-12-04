import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

// ------------------------------
// 🧠 Função inteligente para extrair dados (MULTILINHAS)
// ------------------------------
function parseAnimalData(text) {

    let linhas = text.split("\n").map(l => l.trim()).filter(l => l);

    if (linhas[0].toLowerCase().includes("registrar animal")) {
        linhas.shift();
    }

    const nome = linhas[0] || "SemNome";
    const raca = linhas[1] || "Desconhecida";
    const peso = linhas[2] ? linhas[2].replace(/[^0-9]/g, "") : null;
    const idade = linhas[3] || null;
    const notas = linhas.slice(4).join(" ") || "";

    return { nome, raca, peso, idade, notas };
}

// ------------------------------
// 🐮 Registrar Animal
// ------------------------------
export async function registrarAnimal(phone, msg) {
    try {
        const { nome, raca, peso, idade, notas } = parseAnimalData(msg);

        const { error } = await supabase
            .from("animals")
            .insert([
                {
                    phone,
                    nome,
                    raca,
                    peso: peso ? Number(peso) : null,
                    idade,
                    notas
                }
            ]);

        if (error) throw error;

        return sendMessage(phone, "✅ *Animal registrado com sucesso!*");

    } catch (err) {
        console.error("Erro ao registrar animal:", err);
        return sendMessage(phone, "❌ *Erro ao registrar animal. Verifique os dados enviados.*");
    }
}

// ------------------------------
// 📋 Listar Animais
// ------------------------------
export async function listarAnimais(phone) {
    try {
        const { data, error } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: true });

        if (error) throw error;

        if (!data.length)
            return sendMessage(phone, "📭 *Você ainda não tem animais cadastrados.*");

        let texto = "🐮 *SEUS ANIMAIS:*\n\n";

        data.forEach(a => {
            texto += `ID: ${a.id}
Nome: ${a.nome}
Raça: ${a.raca}
Peso: ${a.peso || "—"} kg
Idade: ${a.idade || "—"}
Notas: ${a.notas || "—"}
---------------------\n`;
        });

        return sendMessage(phone, texto);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ *Erro ao listar animais.*");
    }
}
