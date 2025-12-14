import { extrairPesoDaMensagem } from "../../src/utils/extract.js";

test("extrai peso da mensagem", () => {
  const peso = extrairPesoDaMensagem("boi com 450kg");
  expect(peso).toBe(450);
});
