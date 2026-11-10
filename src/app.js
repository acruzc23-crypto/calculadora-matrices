import * as M from "./matrices.js";
import { F } from "./fraccion.js";

const $ = (s) => document.querySelector(s);
const contenedor = $("#matrices");
const error = $("#error");

const OPERACIONES = {
  determinante: { matrices: [{ id: "A", cuadrada: true }], ejemplo: { A: [["2", "-3", "1"], ["2", "0", "-1"], ["1", "4", "5"]] } },
  inversa: { matrices: [{ id: "A", cuadrada: true }], ejemplo: { A: [["2", "1", "1"], ["1", "3", "2"], ["1", "0", "0"]] } },
  sistema: {
    matrices: [{ id: "A", nombre: "Coeficientes" }, { id: "b", nombre: "b", columnaFija: 1, filasDe: "A" }],
    ejemplo: { A: [["2", "1", "-1"], ["-3", "-1", "2"], ["-2", "1", "2"]], b: [["8"], ["-11"], ["-3"]] },
  },
  producto: {
    matrices: [{ id: "A" }, { id: "B", filasDeColumnas: "A" }],
    ejemplo: { A: [["1", "2", "0"], ["-1", "3", "1/2"]], B: [["2", "1"], ["0", "-1"], ["4", "2"]] },
  },
  rango: { matrices: [{ id: "A" }], ejemplo: { A: [["1", "2", "3"], ["2", "4", "6"], ["1", "0", "1"]] } },
  transpuesta: { matrices: [{ id: "A" }], ejemplo: { A: [["1", "2", "3"], ["4", "5", "6"]] } },
};

let op = "determinante";
let tamanos = { A: [3, 3], B: [3, 2], b: [3, 1] };
let valores = {};

function guardarValores() {
  for (const input of contenedor.querySelectorAll(".celda")) {
    const { m, i, j } = input.dataset;
    valores[m] ??= {};
    valores[m][`${i},${j}`] = input.value;
  }
}

function ajustarDependencias() {
  const cfg = OPERACIONES[op];
  for (const d of cfg.matrices) {
    if (d.cuadrada) tamanos[d.id][1] = tamanos[d.id][0];
    if (d.filasDe) tamanos[d.id] = [tamanos[d.filasDe][0], d.columnaFija];
    if (d.filasDeColumnas) tamanos[d.id][0] = tamanos[d.filasDeColumnas][1];
  }
}

function controlTamano(id, eje, etiqueta) {
  const caja = document.createElement("span");
  caja.className = "tamano";
  const menos = Object.assign(document.createElement("button"), { type: "button", textContent: "−", ariaLabel: `Menos ${etiqueta}` });
  const mas = Object.assign(document.createElement("button"), { type: "button", textContent: "+", ariaLabel: `Más ${etiqueta}` });
  const texto = Object.assign(document.createElement("span"), { textContent: `${tamanos[id][eje]} ${etiqueta}` });
  const cambiar = (d) => {
    guardarValores();
    tamanos[id][eje] = Math.min(6, Math.max(1, tamanos[id][eje] + d));
    pintarEntrada();
  };
  menos.addEventListener("click", () => cambiar(-1));
  mas.addEventListener("click", () => cambiar(1));
  caja.append(menos, texto, mas);
  return caja;
}

function pintarEntrada() {
  ajustarDependencias();
  const cfg = OPERACIONES[op];
  contenedor.replaceChildren();
  cfg.matrices.forEach((d, k) => {
    if (k > 0) contenedor.append(Object.assign(document.createElement("span"), { className: "igual", textContent: d.id === "b" ? "|" : "×" }));
    const [filas, cols] = tamanos[d.id];
    const bloque = document.createElement("div");
    bloque.className = "bloque-matriz";
    const cabeza = document.createElement("div");
    cabeza.className = "cabeza-matriz";
    cabeza.append(Object.assign(document.createElement("span"), { className: "nombre", textContent: d.nombre ?? d.id }));
    if (!d.filasDe) {
      if (!d.filasDeColumnas) cabeza.append(controlTamano(d.id, 0, d.cuadrada ? "× " + filas : filas === 1 ? "fila" : "filas"));
      if (!d.cuadrada) cabeza.append(controlTamano(d.id, 1, cols === 1 ? "columna" : "columnas"));
    }
    if (d.cuadrada) cabeza.querySelector(".tamano span").textContent = `${filas} × ${filas}`;
    const grilla = document.createElement("div");
    grilla.className = "corchetes";
    grilla.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    for (let i = 0; i < filas; i++) {
      for (let j = 0; j < cols; j++) {
        const input = document.createElement("input");
        input.className = "celda";
        input.inputMode = "decimal";
        input.dataset.m = d.id;
        input.dataset.i = i;
        input.dataset.j = j;
        input.value = valores[d.id]?.[`${i},${j}`] ?? "";
        input.placeholder = "0";
        input.setAttribute("aria-label", `${d.id} fila ${i + 1} columna ${j + 1}`);
        grilla.append(input);
      }
    }
    bloque.append(cabeza, grilla);
    contenedor.append(bloque);
  });
}

function leer(id) {
  const [filas, cols] = tamanos[id];
  const m = [];
  let malo = null;
  for (let i = 0; i < filas; i++) {
    m.push([]);
    for (let j = 0; j < cols; j++) {
      const input = contenedor.querySelector(`.celda[data-m="${id}"][data-i="${i}"][data-j="${j}"]`);
      input.classList.remove("mala");
      try {
        m[i].push(String(F(input.value)));
      } catch (e) {
        input.classList.add("mala");
        malo ??= { input, mensaje: e.message };
      }
    }
  }
  if (malo) {
    malo.input.focus();
    throw new M.ErrorMatriz(`${id}, fila ${Number(malo.input.dataset.i) + 1}, columna ${Number(malo.input.dataset.j) + 1}: ${malo.mensaje}`);
  }
  return m;
}

function tabla(matriz, info = {}) {
  const t = document.createElement("div");
  t.className = "tabla";
  t.style.gridTemplateColumns = `repeat(${matriz[0].length}, auto)`;
  matriz.forEach((fila, i) =>
    fila.forEach((v, j) => {
      const s = document.createElement("span");
      s.textContent = v;
      if (info.filas?.includes(i)) s.classList.add("fila");
      if (info.pivote && info.pivote[0] === i && info.pivote[1] === j) s.classList.add("pivote");
      if (info.diagonal && i === j) s.classList.add("diagonal");
      if (info.columna === j) s.classList.add("columna");
      if (info.separador === j) s.classList.add("sep");
      if (info.celda && info.celda[0] === i && info.celda[1] === j) s.classList.add("celda-producto");
      t.append(s);
    }),
  );
  return t;
}

function pintarPasos(pasos, final) {
  $("#pasos").replaceChildren(
    ...pasos.map((p, k) => {
      const li = document.createElement("li");
      li.className = "paso";
      li.style.setProperty("--i", Math.min(k, 12));
      const texto = document.createElement("p");
      const m = p.descripcion.match(/^(F\d+ (?:→|↔) [^.]*?)( para| \.|\.|$)(.*)/);
      if (m) {
        texto.append(Object.assign(document.createElement("span"), { className: "op", textContent: m[1] }), m[2] + m[3]);
      } else {
        texto.textContent = p.descripcion;
      }
      li.append(texto);
      const matriz = p.matriz ?? (p.celda ? final : null);
      if (matriz) {
        const caja = document.createElement("div");
        caja.className = "matriz-paso";
        caja.append(tabla(matriz, p));
        li.append(caja);
      }
      return li;
    }),
  );
}

function respuesta(etiqueta, contenido, nota) {
  const r = $("#respuesta");
  r.replaceChildren(Object.assign(document.createElement("span"), { className: "etiqueta", textContent: etiqueta }));
  if (typeof contenido === "string") r.append(Object.assign(document.createElement("span"), { className: "valor", textContent: contenido }));
  else r.append(contenido);
  if (nota) r.append(Object.assign(document.createElement("p"), { className: "nota", textContent: nota }));
}

function lista(items) {
  const ul = document.createElement("ul");
  ul.append(...items.map((t) => Object.assign(document.createElement("li"), { textContent: t })));
  return ul;
}

function resolver() {
  error.hidden = true;
  try {
    let pasos = [];
    let final = null;
    if (op === "determinante") {
      const r = M.determinante(leer("A"));
      respuesta("det(A) =", r.valor, r.valor.includes("/") ? `≈ ${r.decimal.toFixed(4)}` : r.valor === "0" ? "La matriz es singular: no tiene inversa." : "");
      pasos = r.pasos;
    } else if (op === "inversa") {
      const r = M.inversa(leer("A"));
      if (r.existe) respuesta("A⁻¹ =", tabla(r.inversa));
      else respuesta("A no tiene inversa", "", "Su determinante es 0.");
      pasos = r.pasos;
    } else if (op === "sistema") {
      const b = leer("b").map((f) => f[0]);
      const r = M.resolverSistema(leer("A"), b);
      if (r.tipo === "unica") respuesta("Solución única:", lista(Object.entries(r.solucion).map(([k, v]) => `${k} = ${v}`)));
      else if (r.tipo === "infinitas") respuesta("Infinitas soluciones:", lista(r.ecuaciones), `Con ${r.libres.join(", ")} libre${r.libres.length > 1 ? "s" : ""}: elige cualquier valor y obtienes una solución.`);
      else respuesta("Sin solución", "", "Las ecuaciones se contradicen entre sí.");
      pasos = r.pasos;
    } else if (op === "producto") {
      const r = M.multiplicar(leer("A"), leer("B"));
      respuesta("A·B =", tabla(r.producto));
      final = r.producto;
      pasos = r.pasos;
    } else if (op === "rango") {
      const r = M.rango(leer("A"));
      respuesta("rango(A) =", String(r.valor));
      pasos = r.pasos;
    } else if (op === "transpuesta") {
      const t = M.transpuesta(leer("A"));
      respuesta("Aᵀ =", tabla(t), "Las filas de A pasan a ser las columnas.");
    }
    pintarPasos(pasos, final);
    $("#solucion").hidden = false;
    $("#solucion").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  } catch (e) {
    if (!(e instanceof M.ErrorMatriz) && !(e instanceof RangeError)) throw e;
    error.textContent = e.message;
    error.hidden = false;
  }
}

function cargarEjemplo() {
  const ej = OPERACIONES[op].ejemplo;
  valores = {};
  for (const [id, m] of Object.entries(ej)) {
    tamanos[id] = [m.length, m[0].length];
    valores[id] = {};
    m.forEach((f, i) => f.forEach((v, j) => (valores[id][`${i},${j}`] = v)));
  }
  pintarEntrada();
}

document.querySelector(".operaciones").addEventListener("click", (e) => {
  const b = e.target.closest("[data-op]");
  if (!b) return;
  guardarValores();
  op = b.dataset.op;
  document.querySelectorAll("[data-op]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  $("#solucion").hidden = true;
  error.hidden = true;
  cargarEjemplo();
});
$("#entrada").addEventListener("submit", (e) => {
  e.preventDefault();
  guardarValores();
  resolver();
});
$("#ejemplo").addEventListener("click", cargarEjemplo);
$("#limpiar").addEventListener("click", () => {
  valores = {};
  pintarEntrada();
  $("#solucion").hidden = true;
  contenedor.querySelector(".celda")?.focus();
});

cargarEjemplo();
