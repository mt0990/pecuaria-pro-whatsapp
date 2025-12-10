import supabase from "../database/supabase.js";

// ===============================
// 🧠 PARSE AUTOMÁTICO
// ===============================
function parseAnimalData(text) {
    text = text.replace(/registrar animal/i, "").trim();
    const partes = text.split(/\s+|\n/).filter(p => p.trim());

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
        console.error(err);
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

        if (!data.length) return "📭 *Você ainda não tem animais cadastrados.*";

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

        return texto;

    } catch (err) {
        console.error(err);
        return "❌ *Erro ao listar animais.*";
    }
}

// ===============================
// ✏️ Editar
// ===============================
export async function editarAnimal(phone, msg) {
    try {
        const linhas = msg.split("\n").map(l => l.trim()).filter(l => l);
        if (linhas.length < 2) {
            return "⚠️ Formato inválido!\n\nUse:\neditar animal ID\nNome\nRaça\nPeso\nIdade\nNotas";
        }

        const primeiraLinha = linhas[0].split(" ");
        const id = Number(primeiraLinha[2]);
        if (!id) return "❌ ID inválido.";

        const nome = linhas[1] || null;
        const raca = linhas[2] || null;
        const peso = linhas[3] ? linhas[3].replace(/[^0-9]/g, "") : null;
        const idade = linhas[4] || null;
        const notas = linhas.slice(5).join(" ");

        const campos = {};
        if (nome) campos.nome = nome;
        if (raca) campos.raca = raca;
        if (peso) campos.peso = Number(peso);
        if (idade) campos.idade = idade;
        if (notas) campos.notas = notas;

        if (Object.keys(campos).length === 0) {
            return "⚠️ Nenhuma informação enviada para atualizar.";
        }

        const { error } = await supabase
            .from("animals")
            .update(campos)
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

        return `✅ Animal *${id}* atualizado!\nCampos modificados:\n${JSON.stringify(campos, null, 2)}`;

    } catch (err) {
        console.error(err);
        return "❌ Erro ao editar animal.";
    }
}

// ===============================
// ❌ Remover
// ===============================
export async function removerAnimal(phone, msg) {
    try {
        const partes = msg.split(" ");
        const id = Number(partes[2]);

        if (!id) return "❌ Envie: remover animal ID";

        const { error } = await supabase
            .from("animals")
            .delete()
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

        return `🗑️ *Animal ${id} removido!*`;

    } catch (err) {
        console.error(err);
        return "❌ Erro ao remover animal.";
    }
}
