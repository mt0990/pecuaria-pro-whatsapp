import { registrarAnimal } from "../../src/controllers/animalController.js";

test("registrarAnimal responde quando dados estão incompletos", async () => {
  const r = await registrarAnimal("5599999999", "registrar animal");
  expect(r).toBeDefined();
});

test("registrarAnimal não quebra com mensagem inválida", async () => {
  const r = await registrarAnimal("5599999999", null);
  expect(r).toBeDefined();
});
