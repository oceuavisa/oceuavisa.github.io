/* Lista de espera da leitura (config.js MODO "espera"). Sem cookie, sem localStorage, sem rastreador.
   A origem da visita vem só dos parâmetros utm_ do link (o vídeo, a rede) e vai junto com a inscrição.
   O endereço da Lambda fica em window.OCA_CONFIG.LISTA_URL; vazio = modo demonstração (nada é enviado).
   Contrato (ferramentas/leitura/aws/lista_espera.py):
     POST {LISTA_URL}/inscrever  {email, maior18, consentimento, novidades, origem:{utm_*}, pagina, site, versao}
     POST {LISTA_URL}/sair       {email}
     → 200 {"ok":true, "cupom":{codigo, preco_cheio, preco_cupom, validade}} · 422 {"erro":"..."} · 429 (muitas tentativas)
   `versao` diz à Lambda qual texto de consentimento a pessoa viu (v2 = com o cupom de fundador, 20/11).
   Mudou o texto do consentimento na página? Suba a versão aqui e em lista_espera.py. */
(function () {
  "use strict";
  var CFG = window.OCA_CONFIG || {};
  if (CFG.MODO !== "espera") return;
  var URL_LISTA = (CFG.LISTA_URL || "").replace(/\/+$/, "");
  var DEMO = !URL_LISTA;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("form-lista")) return;
  if (DEMO) $("lista-demo").hidden = false;
  var VERSAO = "lista-espera-v2";
  var BOTAO = "Quero o meu cupom";

  /* ---------- números do cupom (config.js) ---------- */
  function trocar(sel, valor) {
    if (valor === undefined || valor === null || valor === "") return;
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) { el.textContent = String(valor); });
  }
  trocar(".cupom-cheio", CFG.PRECO_CHEIO);
  trocar(".cupom-preco", CFG.PRECO_LANCAMENTO);
  function reais(v) { return "R$ " + Number(v).toFixed(2).replace(".", ","); }
  trocar(".cupom-dias", CFG.CUPOM_DIAS);

  /* ---------- origem (utm_ do link) ---------- */
  var CHAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  var VALOR_OK = /^[A-Za-z0-9._\-]{1,80}$/;
  function origem() {
    var q = new URLSearchParams(location.search), o = {};
    CHAVES.forEach(function (k) { var v = (q.get(k) || "").trim(); if (VALOR_OK.test(v)) o[k] = v; });
    return o;
  }
  var ORIGEM = origem();

  /* ---------- validação ---------- */
  var EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
  function erro(id, msg) {
    var el = $("e-" + id); if (el) el.textContent = msg || "";
    var campo = document.getElementById(id); if (campo) campo.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function enviar(rota, corpo) {
    if (DEMO) return new Promise(function (ok) {
      var j = { ok: true };
      if (rota === "/inscrever") j.cupom = { codigo: "FUNDADOR-DEMO" };
      setTimeout(function () { ok({ status: 200, json: j }); }, 300);
    });
    return fetch(URL_LISTA + rota, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo),
      credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; });
    });
  }

  /* ---------- inscrever ---------- */
  $("form-lista").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = $("lista-email").value.trim(), ok = true;
    erro("lista-email"); erro("lista-18"); erro("lista-consent"); $("lista-erro").hidden = true;
    if (!EMAIL.test(email)) { erro("lista-email", "Confira o e-mail: algo como nome@exemplo.com."); ok = false; }
    if (!$("lista-18").checked) { erro("lista-18", "A leitura é só para maiores de 18 anos."); ok = false; }
    if (!$("lista-consent").checked) { erro("lista-consent", "Para entrar na lista, marque a autorização do uso do e-mail."); ok = false; }
    if (!ok) { var inv = document.querySelector("#form-lista [aria-invalid=true]"); if (inv) inv.focus(); return; }

    var btn = $("lista-btn"); btn.disabled = true; btn.textContent = "Enviando…";
    enviar("/inscrever", {
      email: email, maior18: true, consentimento: true, novidades: $("lista-novidades").checked,
      origem: ORIGEM, pagina: location.pathname, site: $("lista-site").value, versao: VERSAO
    }).then(function (r) {
      if (r.status === 200 && r.json.ok) {
        var c = r.json.cupom;
        if (c && /^FUNDADOR-[A-Z0-9]{4,6}$/.test(c.codigo || "")) {
          $("lista-cupom-codigo").textContent = c.codigo;
          if (typeof c.preco_cupom === "number") $("lista-cupom-preco").textContent = reais(c.preco_cupom);
          if (typeof c.preco_cheio === "number") $("lista-cupom-cheio").textContent = reais(c.preco_cheio);
          $("lista-cupom").hidden = false;
        }
        $("form-lista").hidden = true; $("lista-ok").hidden = false; $("lista-ok-demo").hidden = !DEMO; $("lista-ok").focus();
        return;
      }
      var msg = r.status === 429 ? "Muitas tentativas seguidas. Espere alguns minutos e tente de novo."
        : (r.json && r.json.erro) || "Não deu certo agora. Tente de novo em instantes.";
      $("lista-erro").textContent = msg; $("lista-erro").hidden = false;
    }).catch(function () {
      $("lista-erro").textContent = "Sem conexão com o servidor. Confira a internet e tente de novo."; $("lista-erro").hidden = false;
    }).then(function () { btn.disabled = false; btn.textContent = BOTAO; });
  });

  /* ---------- copiar o código ---------- */
  $("lista-cupom-copiar").addEventListener("click", function () {
    var b = this, codigo = $("lista-cupom-codigo").textContent;
    var feito = function () { b.textContent = "Copiado!"; setTimeout(function () { b.textContent = "Copiar o código"; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(codigo).then(feito, function () {});
    else {
      var r = document.createRange(); r.selectNodeContents($("lista-cupom-codigo"));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  });

  /* ---------- sair da lista ---------- */
  $("form-sair").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = $("sair-email").value.trim(); erro("sair-email");
    if (!EMAIL.test(email)) { erro("sair-email", "Confira o e-mail."); $("sair-email").focus(); return; }
    var btn = $("sair-btn"); btn.disabled = true;
    enviar("/sair", { email: email }).then(function (r) {
      if (r.status === 200) { $("form-sair").hidden = true; $("sair-ok").hidden = false; }
      else erro("sair-email", r.status === 429 ? "Muitas tentativas. Espere alguns minutos." : "Não deu certo agora. Escreva para oceuavisa@gmail.com.");
    }).catch(function () { erro("sair-email", "Sem conexão. Tente de novo ou escreva para oceuavisa@gmail.com."); })
      .then(function () { btn.disabled = false; });
  });
})();
