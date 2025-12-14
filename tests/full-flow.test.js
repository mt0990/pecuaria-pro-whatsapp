import { processarMensagem } from "../src/services/nlp.js";

test("Fluxo completo via NLP não quebra", async () => {
  const r = await processarMensagem(
    "5599999999",
    "registrar animal boi nelore 450 24"
  );
  expect(r).toBeDefined();
});
