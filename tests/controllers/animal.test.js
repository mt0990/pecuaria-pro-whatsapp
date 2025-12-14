import { registrarAnimal } from "../../src/controllers/animalController.js";

test("Registrar animal não quebra", async () => {
    const r = await registrarAnimal("559999", {
        nome: "Boi Teste",
        raca: "Nelore",
        peso: 450,
        idade: 24
    });
    expect(r).toBeDefined();
});
