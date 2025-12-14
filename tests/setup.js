import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

process.env.NODE_ENV = "test";

// 🔧 IMPORTAR JEST EXPLICITAMENTE (ESM)
import { jest } from "@jest/globals";

// 🔧 MOCK DO FETCH
import "./mocks/fetch.mock.js";

// 🔧 MOCK DO SUPABASE (FORMA CORRETA EM ESM)
await jest.unstable_mockModule("../src/database/supabase.js", async () => {
    const supabaseMock = (await import("./mocks/supabase.mock.js")).default;
    return {
        default: supabaseMock
    };
});
