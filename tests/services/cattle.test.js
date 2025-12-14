import { calcularUA } from "../../src/services/cattle.js";

test("calcularUA retorna mensagem válida para entrada correta", () => {
  const r = calcularUA("ua 450kg");
  expect(typeof r).toBe("string");
  expect(r).toContain("ua");
});
