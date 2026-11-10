// Fracciones exactas con BigInt, para que 1/3 no se convierta en 0.333333.

const abs = (n) => (n < 0n ? -n : n);
function mcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}

export class Fraccion {
  constructor(num, den = 1n) {
    num = BigInt(num);
    den = BigInt(den);
    if (den === 0n) throw new RangeError("División por cero");
    if (den < 0n) [num, den] = [-num, -den];
    const g = mcd(num, den);
    this.num = num / g;
    this.den = den / g;
  }

  static de(valor) {
    if (valor instanceof Fraccion) return valor;
    if (typeof valor === "number") {
      if (!Number.isFinite(valor)) throw new RangeError("Número no válido");
      return Fraccion.de(String(valor));
    }
    const texto = String(valor).trim().replace(",", ".").replace("−", "-");
    if (texto === "" || texto === "-") return new Fraccion(0n);
    let m = texto.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (m) {
      if (BigInt(m[2]) === 0n) throw new RangeError(`"${valor}" divide entre cero`);
      return new Fraccion(BigInt(m[1]), BigInt(m[2]));
    }
    m = texto.match(/^([+-]?)(\d*)\.?(\d*)$/);
    if (m && (m[2] || m[3])) {
      const decimales = m[3] ?? "";
      const entero = BigInt((m[2] || "0") + decimales);
      return new Fraccion(m[1] === "-" ? -entero : entero, 10n ** BigInt(decimales.length));
    }
    throw new RangeError(`"${valor}" no es un número. Usa enteros, decimales o fracciones como 3/4.`);
  }

  sumar(o) { o = Fraccion.de(o); return new Fraccion(this.num * o.den + o.num * this.den, this.den * o.den); }
  restar(o) { o = Fraccion.de(o); return new Fraccion(this.num * o.den - o.num * this.den, this.den * o.den); }
  multiplicar(o) { o = Fraccion.de(o); return new Fraccion(this.num * o.num, this.den * o.den); }
  dividir(o) {
    o = Fraccion.de(o);
    if (o.num === 0n) throw new RangeError("División por cero");
    return new Fraccion(this.num * o.den, this.den * o.num);
  }
  negar() { return new Fraccion(-this.num, this.den); }
  esCero() { return this.num === 0n; }
  esUno() { return this.num === 1n && this.den === 1n; }
  igual(o) { o = Fraccion.de(o); return this.num === o.num && this.den === o.den; }
  toNumber() { return Number(this.num) / Number(this.den); }
  toString() { return this.den === 1n ? String(this.num) : `${this.num}/${this.den}`; }
}

export const F = (v) => Fraccion.de(v);
