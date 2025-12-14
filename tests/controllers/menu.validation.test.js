import { mostrarMenu, processarOpcaoMenu } from "../../src/controllers/menuController.js";

test("mostrarMenu retorna resposta válida", async () => {
  const r = await mostrarMenu("5599999999");
  expect(r).toBeDefined();
});

test("processarOpcaoMenu lida com opção inválida", async () => {
  const r = await processarOpcaoMenu("5599999999", "99");
  expect(r).toBeDefined();
});

test("processarOpcaoMenu lida com entrada nula", async () => {
  const r = await processarOpcaoMenu("5599999999", null);
  expect(r).toBeDefined();
});
