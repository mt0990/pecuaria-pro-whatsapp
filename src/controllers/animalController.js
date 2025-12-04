import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

// ------------------------------
// 🧠 Função inteligente para extrair dados
// ------------------------------
function parseAnimalData(text) {
    const linhas = text.split("\n").map(l => l.trim()).filter(l => l);

    // Remove o comando "registrar animal"
    linhas[0] = linhas[0].replace(/registrar animal/i, "").trim();

    const texto = linhas.join(" ");

    // Nome
    const nome = texto.split(" ")[0] || "SemNome";

    // Raça = tudo após nome até chegarem números
    const raca = texto.match(/[a-zA-ZÀ-ú]+( [a-zA-ZÀ-ú]+)*/)?.[0] || "Desconhecida";

    // Peso
    const pesoRegex = /(\d+)\s*(kg|quilo|kilo)?/i;
    const peso = texto.match(pesoRegex)?.[1] || null;

    // Idade
const idadeRegex = /(\d+)\s*(ano|anos|mês|meses|dia|dias)?/i;
const idadeMatch = texto.match(idadeRegex);
const idade = idadeMatch ? idadeMatch[0] : null;

// Notas
const notas = texto
    .replace(raca, "")
    .replace(pesoRegex, "")
    .replace(idadeRegex, "")
    .replace(nome, "")
    .trim() || "";

// Retornar dados corretamente
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
