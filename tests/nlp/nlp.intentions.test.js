import { processarMensagem } from "../../src/services/nlp.js";

test("NLP responde ao comando 'menu'", async () => {
  const r = await processarMensagem("5599999999", "menu");
  expect(r).toBeDefined();
});

test("NLP responde ao comando 'listar animais'", async () => {
  const r = await processarMensagem("5599999999", "listar animais");
  expect(r).toBeDefined();
});
