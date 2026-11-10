// Operaciones con matrices que guardan cada paso para mostrarlo.
// Una matriz es un arreglo de filas de Fraccion.
import { Fraccion, F } from "./fraccion.js";

export class ErrorMatriz extends Error {}

export const desdeTexto = (filas) => filas.map((f) => f.map((v) => F(v)));
export const aTexto = (m) => m.map((f) => f.map(String));
const copiar = (m) => m.map((f) => [...f]);
const identidad = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => F(i === j ? 1 : 0)));

function exigirCuadrada(m, que) {
  if (m.length === 0 || m.some((f) => f.length !== m.length)) {
    throw new ErrorMatriz(`${que} solo existe para matrices cuadradas (n × n).`);
  }
}

// Texto bonito de una operación de fila: "F2 → F2 − 3·F1"
function textoOperacion(destino, factor, origen) {
  const neg = factor.num < 0n;
  const f = neg ? factor.negar() : factor;
  const coef = f.esUno() ? "" : `${f}·`;
  return `F${destino + 1} → F${destino + 1} ${neg ? "+" : "−"} ${coef}F${origen + 1}`;
}

const foto = (m, extra = {}) => ({ matriz: aTexto(m), ...extra });

/**
 * Gauss-Jordan sobre una matriz (opcionalmente aumentada).
 * columnas: cuántas columnas de la izquierda se usan para pivotear.
 */
export function gaussJordan(entrada, { columnas = entrada[0].length, separador = null, reducida = true } = {}) {
  const m = copiar(entrada);
  const filas = m.length;
  const pasos = [foto(m, { descripcion: "Matriz inicial.", separador })];
  const pivotes = [];
  let intercambios = 0;
  let fila = 0;

  for (let col = 0; col < columnas && fila < filas; col++) {
    let p = fila;
    while (p < filas && m[p][col].esCero()) p++;
    if (p === filas) {
      pasos.push(foto(m, { descripcion: `La columna ${col + 1} no tiene pivote: es columna libre.`, columna: col, separador }));
      continue;
    }
    if (p !== fila) {
      [m[p], m[fila]] = [m[fila], m[p]];
      intercambios++;
      pasos.push(foto(m, { descripcion: `Intercambio F${fila + 1} ↔ F${p + 1} para tener un pivote distinto de cero.`, filas: [fila, p], pivote: [fila, col], separador }));
    }
    const piv = m[fila][col];
    if (reducida && !piv.esUno()) {
      m[fila] = m[fila].map((v) => v.dividir(piv));
      pasos.push(foto(m, { descripcion: `F${fila + 1} → F${fila + 1} ÷ ${piv} para que el pivote sea 1.`, filas: [fila], pivote: [fila, col], separador }));
    }
    for (let r = reducida ? 0 : fila + 1; r < filas; r++) {
      if (r === fila || m[r][col].esCero()) continue;
      const factor = m[r][col].dividir(m[fila][col]);
      m[r] = m[r].map((v, j) => v.restar(factor.multiplicar(m[fila][j])));
      pasos.push(foto(m, { descripcion: `${textoOperacion(r, factor, fila)} para hacer cero debajo${reducida ? " o encima" : ""} del pivote.`, filas: [r], pivote: [fila, col], separador }));
    }
    pivotes.push([fila, col]);
    fila++;
  }
  return { matriz: m, pasos, pivotes, rango: pivotes.length, intercambios };
}

export function determinante(entrada) {
  const a = desdeTexto(entrada);
  exigirCuadrada(a, "El determinante");
  const n = a.length;
  const m = copiar(a);
  const pasos = [foto(m, { descripcion: "Llevo la matriz a forma triangular. El determinante será el producto de la diagonal." })];
  let signo = F(1);
  for (let col = 0; col < n; col++) {
    let p = col;
    while (p < n && m[p][col].esCero()) p++;
    if (p === n) {
      pasos.push(foto(m, { descripcion: `La columna ${col + 1} se quedó sin pivote: det = 0.`, columna: col }));
      return { valor: "0", pasos, decimal: 0 };
    }
    if (p !== col) {
      [m[p], m[col]] = [m[col], m[p]];
      signo = signo.negar();
      pasos.push(foto(m, { descripcion: `Intercambio F${col + 1} ↔ F${p + 1}. Cada intercambio cambia el signo del determinante.`, filas: [col, p], pivote: [col, col] }));
    }
    for (let r = col + 1; r < n; r++) {
      if (m[r][col].esCero()) continue;
      const factor = m[r][col].dividir(m[col][col]);
      m[r] = m[r].map((v, j) => v.restar(factor.multiplicar(m[col][j])));
      pasos.push(foto(m, { descripcion: `${textoOperacion(r, factor, col)}. Esto no cambia el determinante.`, filas: [r], pivote: [col, col] }));
    }
  }
  let valor = signo;
  for (let i = 0; i < n; i++) valor = valor.multiplicar(m[i][i]);
  const diagonal = m.map((f, i) => String(f[i])).join(" · ");
  pasos.push(foto(m, {
    descripcion: `det = ${signo.num < 0n ? "−(" : ""}${diagonal}${signo.num < 0n ? ")" : ""} = ${valor}`,
    diagonal: true,
  }));
  return { valor: String(valor), decimal: valor.toNumber(), pasos };
}

export function inversa(entrada) {
  const a = desdeTexto(entrada);
  exigirCuadrada(a, "La inversa");
  const n = a.length;
  const aumentada = a.map((f, i) => [...f, ...identidad(n)[i]]);
  const r = gaussJordan(aumentada, { columnas: n, separador: n });
  r.pasos[0].descripcion = "Escribo [A | I] y aplico Gauss-Jordan hasta que la izquierda sea la identidad.";
  if (r.rango < n) {
    return {
      existe: false,
      pasos: [...r.pasos, foto(r.matriz, { descripcion: `El rango es ${r.rango} < ${n}: la matriz es singular (det = 0) y no tiene inversa.`, separador: n })],
    };
  }
  const inv = r.matriz.map((f) => f.slice(n));
  r.pasos.push(foto(r.matriz, { descripcion: "La izquierda ya es la identidad: la derecha es A⁻¹.", separador: n, resultado: true }));
  return { existe: true, inversa: aTexto(inv), pasos: r.pasos };
}

export function resolverSistema(coeficientes, terminos) {
  const a = desdeTexto(coeficientes);
  const b = terminos.map((v) => F(v));
  if (b.length !== a.length) throw new ErrorMatriz("Debe haber un término independiente por ecuación.");
  const vars = a[0].length;
  const r = gaussJordan(a.map((f, i) => [...f, b[i]]), { columnas: vars, separador: vars });
  r.pasos[0].descripcion = "Escribo la matriz aumentada [A | b] y la reduzco.";
  const inconsistente = r.matriz.some((f) => f.slice(0, vars).every((v) => v.esCero()) && !f[vars].esCero());
  if (inconsistente) {
    r.pasos.push(foto(r.matriz, { descripcion: "Una fila dice 0 = algo distinto de 0: el sistema no tiene solución.", separador: vars }));
    return { tipo: "sin-solucion", pasos: r.pasos };
  }
  const nombres = vars <= 4 ? ["x", "y", "z", "w"].slice(0, vars) : Array.from({ length: vars }, (_, i) => `x${i + 1}`);
  if (r.rango < vars) {
    const columnasPivote = new Set(r.pivotes.map(([, c]) => c));
    const libres = nombres.filter((_, i) => !columnasPivote.has(i));
    const ecuaciones = r.pivotes.map(([fila, col]) => {
      let texto = `${nombres[col]} = ${r.matriz[fila][vars]}`;
      for (let j = 0; j < vars; j++) {
        if (j === col || columnasPivote.has(j) || r.matriz[fila][j].esCero()) continue;
        const c = r.matriz[fila][j].negar();
        texto += ` ${c.num < 0n ? "−" : "+"} ${c.num < 0n ? c.negar() : c}${nombres[j]}`.replace(/ 1([a-z])/, " $1");
      }
      return texto;
    });
    r.pasos.push(foto(r.matriz, { descripcion: `Rango ${r.rango} < ${vars} incógnitas: hay infinitas soluciones. Variable libre: ${libres.join(", ")}.`, separador: vars }));
    return { tipo: "infinitas", libres, ecuaciones, pasos: r.pasos };
  }
  const solucion = Object.fromEntries(r.pivotes.map(([fila, col]) => [nombres[col], String(r.matriz[fila][vars])]));
  r.pasos.push(foto(r.matriz, { descripcion: `Solución única: ${Object.entries(solucion).map(([k, v]) => `${k} = ${v}`).join(", ")}.`, separador: vars, resultado: true }));
  return { tipo: "unica", solucion, pasos: r.pasos };
}

export function multiplicar(ta, tb) {
  const a = desdeTexto(ta);
  const b = desdeTexto(tb);
  if (a[0].length !== b.length) {
    throw new ErrorMatriz(`No se puede: A tiene ${a[0].length} columnas y B tiene ${b.length} filas. Deben ser iguales.`);
  }
  const pasos = [];
  const c = a.map((fila, i) =>
    b[0].map((_, j) => {
      let suma = F(0);
      const terminos = [];
      for (let k = 0; k < b.length; k++) {
        suma = suma.sumar(fila[k].multiplicar(b[k][j]));
        terminos.push(`(${fila[k]})(${b[k][j]})`);
      }
      pasos.push({ descripcion: `c${i + 1}${j + 1} = ${terminos.join(" + ")} = ${suma}`, celda: [i, j] });
      return suma;
    }),
  );
  return { producto: aTexto(c), pasos };
}

export function transpuesta(entrada) {
  const a = desdeTexto(entrada);
  return aTexto(a[0].map((_, j) => a.map((f) => f[j])));
}

export function rango(entrada) {
  const r = gaussJordan(desdeTexto(entrada), { reducida: false });
  r.pasos.push(foto(r.matriz, { descripcion: `Quedan ${r.rango} filas con pivote: el rango es ${r.rango}.` }));
  return { valor: r.rango, pasos: r.pasos };
}

export { Fraccion };
