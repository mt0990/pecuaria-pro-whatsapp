import { listarLotes } from "../../src/controllers/loteController.js";

test("listarLotes executa sem quebrar", async () => {
  const r = await listarLotes("5599999999");
  expect(r).toBeDefined();
});
