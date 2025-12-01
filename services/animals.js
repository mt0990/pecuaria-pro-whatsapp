import supabase from "../supabase.js";

export async function salvarAnimal({ telefone, nome, raca, peso, idade, notas }) {
    const { data, error } = await supabase
        .from("animals")
        .insert([
            {
                owner_phone: telefone,
                name: nome,
                breed: raca,
                weight: peso,
                age: idade,
                notes: notas,
                created_at: new Date()
            }
        ]);

    if (error) {
        console.log("Erro ao salvar animal:", error);
        return false;
    }

    return true;
}
