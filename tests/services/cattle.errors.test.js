import { calcularUA, custoPorArroba } from "../../src/services/cattle.js";

test("calcularUA retorna mensagem de erro quando peso não é informado", () => {
  const r = calcularUA("ua");
  expect(typeof r).toBe("string");
  expect(r.toLowerCase()).toContain("peso");
});

test("custoPorArroba retorna mensagem de erro quando dados estão incompletos", () => {
  const r = custoPorArroba("custo arroba");
  expect(typeof r).toBe("string");
  expect(r.toLowerCase()).toContain("envie");
});
