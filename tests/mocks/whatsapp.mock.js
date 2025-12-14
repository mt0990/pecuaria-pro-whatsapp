export async function sendMessage(phone, body) {
    console.log("[MOCK WhatsApp]", body);
    return { success: true };
}
