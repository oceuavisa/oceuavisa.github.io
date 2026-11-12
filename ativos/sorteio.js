/* Conferência do sorteio do tarô de O Céu Avisa.
 *
 * Reproduz, no navegador, o sorteio do motor (api/nexus_api/services/draw.py):
 *   rng = random.Random(seed)            # seed em texto
 *   baralho = sorted(cartas, key=number)
 *   rng.shuffle(baralho)
 *   carta i = baralho[i]; orientação = "direita" se rng.random() < 0.5
 *
 * Para dar as mesmas cartas, este arquivo copia o gerador do Python
 * (Mersenne Twister MT19937, semeado como o CPython semeia um texto:
 * versão 2, texto + sha512 do texto). Testado contra cada sorteio gravado
 * em marketing/dados/*\/tarot.json (ferramentas/publicacao/tests/sorteio_js.mjs).
 * Funciona no navegador e no Node (export no fim).
 */
(function (raiz) {
  "use strict";

  // ---- MT19937, igual ao _randommodule.c do CPython ----
  function MT() { this.mt = new Uint32Array(624); this.i = 625; }
  MT.prototype.initGenrand = function (s) {
    const mt = this.mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < 624; i++) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, p) + i) >>> 0;
    }
    this.i = 624;
  };
  MT.prototype.initByArray = function (chave) {
    const mt = this.mt, n = 624, len = chave.length;
    this.initGenrand(19650218);
    let i = 1, j = 0;
    for (let k = Math.max(n, len); k; k--) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1664525)) + chave[j] + j) >>> 0;
      i++; j++;
      if (i >= n) { mt[0] = mt[n - 1]; i = 1; }
      if (j >= len) j = 0;
    }
    for (let k = n - 1; k; k--) {
      const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(p, 1566083941)) - i) >>> 0;
      i++;
      if (i >= n) { mt[0] = mt[n - 1]; i = 1; }
    }
    mt[0] = 0x80000000;
  };
  MT.prototype.uint32 = function () {
    const mt = this.mt;
    if (this.i >= 624) {
      for (let k = 0; k < 624; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % 624] & 0x7fffffff);
        mt[k] = mt[(k + 397) % 624] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      this.i = 0;
    }
    let y = mt[this.i++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  };
  // random(): 53 bits, como random_random do CPython
  MT.prototype.random = function () {
    const a = this.uint32() >>> 5, b = this.uint32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  };
  // getrandbits(k) para k <= 32 e _randbelow(n)
  MT.prototype.randbelow = function (n) {
    const k = n.toString(2).length;
    let r = this.uint32() >>> (32 - k);
    while (r >= n) r = this.uint32() >>> (32 - k);
    return r;
  };

  // random.Random("texto"): int.from_bytes(bytes + sha512(bytes), "big"),
  // depois init_by_array com as palavras de 32 bits, a menos significativa primeiro.
  async function semear(seed, sha512) {
    const bytes = new TextEncoder().encode(seed);
    const hash = new Uint8Array(await sha512(bytes));
    const tudo = new Uint8Array(bytes.length + hash.length);
    tudo.set(bytes); tudo.set(hash, bytes.length);
    // big-endian → palavras little-endian (a última fatia de 4 bytes é a palavra 0)
    let numero = 0n;
    for (const b of tudo) numero = (numero << 8n) | BigInt(b);
    const chave = [];
    while (numero > 0n) { chave.push(Number(numero & 0xffffffffn)); numero >>= 32n; }
    if (!chave.length) chave.push(0);
    const mt = new MT();
    mt.initByArray(chave);
    return mt;
  }

  async function sha512Padrao(bytes) {
    return (raiz.crypto && raiz.crypto.subtle).digest("SHA-512", bytes);
  }

  // O sorteio, igual ao draw() do motor. cartas: [{id, number, name}].
  async function sortear(cartas, quantas, seed, sha512) {
    if (quantas > cartas.length) throw new Error("tiragem maior que o baralho");
    const rng = await semear(seed, sha512 || sha512Padrao);
    const baralho = cartas.slice().sort((a, b) => a.number - b.number);
    for (let i = baralho.length - 1; i > 0; i--) {
      const j = rng.randbelow(i + 1);
      const t = baralho[i]; baralho[i] = baralho[j]; baralho[j] = t;
    }
    const tiradas = [];
    for (let i = 0; i < quantas; i++) {
      tiradas.push({
        card_id: baralho[i].id, name: baralho[i].name, number: baralho[i].number,
        pos: i + 1, orientation: rng.random() < 0.5 ? "direita" : "invertida",
      });
    }
    return tiradas;
  }

  // sha256 das cartas em JSON canônico (o "baralho_sha256" dos vídeos):
  // json.dumps(cartas, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
  function canonico(v) {
    if (Array.isArray(v)) return "[" + v.map(canonico).join(",") + "]";
    if (v && typeof v === "object") {
      return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonico(v[k])).join(",") + "}";
    }
    return JSON.stringify(v);
  }
  async function hashBaralho(cartas, sha256) {
    const bytes = new TextEncoder().encode(canonico(cartas));
    const h = new Uint8Array(sha256 ? await sha256(bytes) : await raiz.crypto.subtle.digest("SHA-256", bytes));
    return Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  const api = { sortear, hashBaralho };
  if (typeof module === "object" && module.exports) module.exports = api;
  else raiz.SorteioOCA = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
