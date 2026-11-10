import { test } from "node:test";
import assert from "node:assert/strict";
import { F } from "../src/fraccion.js";
import * as M from "../src/matrices.js";

test("las fracciones son exactas y se simplifican", () => {
  assert.equal(String(F("2/4")), "1/2");
  assert.equal(String(F("0.25")), "1/4");
  assert.equal(String(F("-1,5")), "-3/2");
  assert.equal(String(F("1/3").sumar("1/6")), "1/2");
  assert.equal(String(F("3/-6")), "-1/2");
  assert.throws(() => F("abc"), /no es un número/);
  assert.throws(() => F("1/0"), /cero/);
});

test("determinante de 2×2, 3×3 y matriz singular", () => {
  assert.equal(M.determinante([["1", "2"], ["3", "4"]]).valor, "-2");
  assert.equal(M.determinante([["2", "-3", "1"], ["2", "0", "-1"], ["1", "4", "5"]]).valor, "49");
  assert.equal(M.determinante([["1", "2"], ["2", "4"]]).valor, "0");
  // necesita intercambio de filas
  assert.equal(M.determinante([["0", "1"], ["1", "0"]]).valor, "-1");
  assert.equal(M.determinante([["1/2", "1/3"], ["1/4", "1/5"]]).valor, "1/60");
  assert.throws(() => M.determinante([["1", "2", "3"], ["4", "5", "6"]]), /cuadradas/);
});

test("la inversa por Gauss-Jordan es exacta", () => {
  const r = M.inversa([["4", "7"], ["2", "6"]]);
  assert.equal(r.existe, true);
  assert.deepEqual(r.inversa, [["3/5", "-7/10"], ["-1/5", "2/5"]]);
  assert.equal(M.inversa([["1", "2"], ["2", "4"]]).existe, false);
});

test("A por su inversa da la identidad", () => {
  const a = [["2", "1", "1"], ["1", "3", "2"], ["1", "0", "0"]];
  const { inversa } = M.inversa(a);
  assert.deepEqual(M.multiplicar(a, inversa).producto, [["1", "0", "0"], ["0", "1", "0"], ["0", "0", "1"]]);
});

test("sistemas: solución única, infinitas y sin solución", () => {
  const unica = M.resolverSistema([["2", "1", "-1"], ["-3", "-1", "2"], ["-2", "1", "2"]], ["8", "-11", "-3"]);
  assert.equal(unica.tipo, "unica");
  assert.deepEqual(unica.solucion, { x: "2", y: "3", z: "-1" });
  const infinitas = M.resolverSistema([["1", "1"], ["2", "2"]], ["3", "6"]);
  assert.equal(infinitas.tipo, "infinitas");
  assert.deepEqual(infinitas.libres, ["y"]);
  assert.equal(infinitas.ecuaciones[0], "x = 3 − y");
  assert.equal(M.resolverSistema([["1", "1"], ["1", "1"]], ["1", "2"]).tipo, "sin-solucion");
});

test("producto, transpuesta y rango", () => {
  assert.deepEqual(M.multiplicar([["1", "2", "3"]], [["4"], ["5"], ["6"]]).producto, [["32"]]);
  assert.throws(() => M.multiplicar([["1", "2"]], [["1", "2"]]), /columnas/);
  assert.deepEqual(M.transpuesta([["1", "2", "3"], ["4", "5", "6"]]), [["1", "4"], ["2", "5"], ["3", "6"]]);
  assert.equal(M.rango([["1", "2", "3"], ["2", "4", "6"], ["1", "0", "1"]]).valor, 2);
});

test("cada paso guarda una copia de la matriz, no una referencia", () => {
  const r = M.determinante([["2", "1"], ["4", "5"]]);
  assert.deepEqual(r.pasos[0].matriz, [["2", "1"], ["4", "5"]]);
  assert.deepEqual(r.pasos.at(-1).matriz, [["2", "1"], ["0", "3"]]);
});
