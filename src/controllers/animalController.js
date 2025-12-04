import supabase from "../database/supabase.js";
import { sendMessage } from "../services/whatsapp.js";

export async function registrarAnimal(phone, dados) {
    try {
        const [_, nome, raca, peso, idade, ...notas] = dados.split(" ");
        
        const { error } = await supabase
            .from("animals")
            .insert([
                {
                    phone,
                    nome,
                    raca,
                    peso: Number(peso),
                    idade,
                    notas: notas.join(" ")
                }
            ]);

        if (error) throw error;

        return sendMessage(phone, "✅ Animal registrado com sucesso!");
        
    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao registrar animal. Verifique os dados.");
    }
}

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
            texto += `ID: ${a.id}\nNome: ${a.nome}\nRaça: ${a.raca}\nPeso: ${a.peso} kg\nIdade: ${a.idade}\n\n`;
        });

        return sendMessage(phone, texto);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao listar animais.");
    }
}
