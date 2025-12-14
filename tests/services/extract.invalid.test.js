import {
  extrairPesoDaMensagem,
  extrairQuantidadeDaMensagem,
  extrairCustoDaMensagem
} from "../../src/utils/extract.js";

test("extrairPeso retorna null quando não há peso", () => {
  const peso = extrairPesoDaMensagem("boi nelore");
  expect(peso).toBeNull();
});

test("extrairQuantidade retorna null quando não há quantidade", () => {
  const qtd = extrairQuantidadeDaMensagem("registrar animal");
  expect(qtd).toBeNull();
});

test("extrairCusto retorna null quando não há custo", () => {
  const custo = extrairCustoDaMensagem("sem valor informado");
  expect(custo).toBeNull();
});
