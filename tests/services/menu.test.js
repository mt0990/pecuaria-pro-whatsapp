import { mostrarMenu } from "../../src/controllers/menuController.js";

test("mostrarMenu executa sem quebrar", async () => {
  const r = await mostrarMenu("5599999999");
  expect(r).toBeDefined();
});
