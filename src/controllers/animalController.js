import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

/**
 * REGISTRAR ANIMAL
 * Formato esperado:
 * registrar animal boi mestiço 349kg 1ano saudável dócil etc...
 */
export async function registrarAnimal(phone, dados) {
    try {
        const texto = dados.replace("registrar animal", "").trim();
        const partes = texto.split(" ");

        if (partes.length < 4) {
            return sendMessage(phone, "❌ Formato inválido.\nUse:\nregistrar animal nome raça peso idade notas");
        }

        const nome = partes[0];
        const raca = partes[1];
        const peso = partes[2]?.replace("kg", "").replace(",", ".") || null;
        const idade = partes[3];
        const notas = partes.slice(4).join(" ");

        const { error } = await supabase
            .from("animals")
            .insert([
                {
                    phone,
                    nome,
                    raca,
                    peso: Number(peso),
                    idade,
                    notas
                }
            ]);

        if (error) throw error;

        return sendMessage(phone, "✅ Animal registrado com sucesso!");

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao registrar animal. Verifique os dados enviados.");
    }
}

/**
 * LISTAR ANIMAIS
 */
export async function listarAnimais(phone) {
    try {
        const { data, error } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone);

        if (error) throw error;

        if (!data.length) {
            return sendMessage(phone, "📭 Você ainda não tem animais cadastrados.");
        }

        let texto = "🐮 *SEUS ANIMAIS:*\n\n";

        data.forEach(a => {
            texto += `➡️ ID: ${a.id}\n`;
            texto += `• Nome: ${a.nome}\n`;
            texto += `• Raça: ${a.raca}\n`;
            texto += `• Peso: ${a.peso} kg\n`;
            texto += `• Idade: ${a.idade}\n`;
            if (a.notas) texto += `• Notas: ${a.notas}\n`;
            texto += `\n`;
        });

        return sendMessage(phone, texto);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao listar animais.");
    }
}
