import { getUser, createUser } from "../database/database.js";

// Verifica se o usuário já existe no banco
export async function usuarioExiste(phone) {
    const user = await getUser(phone);
    return user ? true : false;
}

// Registra novo usuário
export async function registrarUser(phone) {
    console.log("🟢 Novo usuário registrado:", phone);
    await createUser(phone);
}
