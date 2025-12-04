import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

// =======================================================
// 🧠 Função inteligente para extrair dados (linha única ou multilinhas)
// =======================================================
function parseAnimalData(text) {

    // Remove "registrar animal"
    text = text.replace(/registrar animal/i, "").trim();

    // Divide por espaço OU por linhas
    const partes = text.split(/\s+|\n/).filter(p => p.trim());

    const nome = partes[0] || "SemNome";
    const raca = partes[1] || "Desconhecida";

    // Peso: aceita 350, 350kg, 350KG, 350-quilos etc.
    const pesoMatch = text.match(/(\d{2,4})\s*(kg|quilo|kilo)?/i);
    const peso = pesoMatch ? Number(pesoMatch[1]) : null;

    // Idade: aceita "2 anos", "3meses", "4 dias"
    const idadeMatch = text.match(/\d+\s*(ano|anos|m[eê]s|meses|dia|dias)/i);
    const idade = idadeMatch ? idadeMatch[0] : null;

    // Notas = resto do texto
    const notas = text
        .replace(nome, "")
        .replace(raca, "")
        .replace(pesoMatch?.[0] || "", "")
        .replace(idadeMatch?.[0] || "", "")
        .trim();

    return { nome, raca, peso, idade, notas };
}


// =======================================================
// 🐮 Registrar Animal
// =======================================================
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
                    peso,
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


// =======================================================
// 📋 Listar Animais
// =======================================================
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


// =======================================================
// ✏️ Editar Animal
// =======================================================
export async function editarAnimal(phone, msg) {
    try {
        const partes = msg.split(" ");

        // editar animal ID campo valor...
        // ex: editar animal 5 peso 410

        const id = Number(partes[2]);
        const campo = partes[3];
        const valor = partes.slice(4).join(" ");

        if (!id || isNaN(id)) {
            return sendMessage(phone, "❌ ID inválido.");
        }

        const camposPermitidos = ["nome", "raca", "peso", "idade", "notas"];

        if (!camposPermitidos.includes(campo)) {
            return sendMessage(phone, "❌ Campo inválido! Use: nome, raca, peso, idade, notas.");
        }

        const valorFinal = campo === "peso" ? Number(valor) : valor;

        const { error } = await supabase
            .from("animals")
            .update({ [campo]: valorFinal })
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

        return sendMessage(phone, `✅ *Animal ${id} atualizado com sucesso!*`);

    } catch (err) {
        console.error("Erro ao editar animal:", err);
        return sendMessage(phone, "❌ Erro ao editar animal.");
    }
}


// =======================================================
// ❌ Remover Animal
// =======================================================
export async function removerAnimal(phone, msg) {
    try {
        // remover animal 5
        const partes = msg.split(" ");
        const id = Number(partes[2]);

        if (!id) return sendMessage(phone, "❌ Envie: remover animal ID");

        const { error } = await supabase
            .from("animals")
            .delete()
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

        return sendMessage(phone, `🗑️ *Animal ${id} removido com sucesso!*`);

    } catch (err) {
        console.error("Erro ao remover animal:", err);
        return sendMessage(phone, "❌ Erro ao remover animal.");
    }
}
