import dotenv from "dotenv";
dotenv.config();

export const config = {
    PORT: process.env.PORT || 3000,

    // OpenAI
    OPENAI_KEY: process.env.OPENAI_API_KEY,

    // UltraMsg
    ULTRA_INSTANCE: process.env.ULTRAMSG_INSTANCE_ID,
    ULTRA_TOKEN: process.env.ULTRAMSG_TOKEN,
    ULTRA_API_URL: process.env.ULTRAMSG_API_URL,

    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,

    // Bot
    SESSION_MAX_MESSAGES: process.env.SESSION_MAX_MESSAGES || 10
};
