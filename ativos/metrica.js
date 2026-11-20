/* Contagem de visitas SEM cookie e SEM dado pessoal (nossa Lambda `oceuavisa-visitas`; sem serviço de terceiros).
   Uma visita = uma ENTRADA no site: manda uma mensagem curta com o caminho da página, os utm_ do link (rede, vídeo)
   e só o DOMÍNIO de onde a pessoa veio. Navegar de uma página do site para outra não conta de novo.
   Não manda IP (a Lambda não grava), não guarda nada no navegador (nem cookie, nem localStorage) e não cria
   identificador: a Lambda só soma 1 num contador do dia.
   Só conta em oceuavisa.com.br (testes locais e prévias não entram) e respeita "Não rastrear".
   VISITAS_URL vazia = não mede nada. Ver README, "Medição de visitas".
   Também repassa os utm_ do endereço para os links internos, para a lista de espera saber de que vídeo veio
   quem entrou pela vitrine e clicou em "/leitura/" (continua só no endereço; nada fica guardado). */
(function () {
  var VISITAS_URL = "https://sukqo2h2fs5jv4c32munxsqjye0vglzl.lambda-url.us-east-1.on.aws";
  var OK = /^[A-Za-z0-9._\-]{1,80}$/, CHAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  var q = new URLSearchParams(location.search), utm = {};
  CHAVES.forEach(function (k) { var v = (q.get(k) || "").trim(); if (OK.test(v)) utm[k] = v; });

  /* utm_ nos links internos (só se o link ainda não tem utm_) */
  function repassar() {
    if (!Object.keys(utm).length) return;
    var links = document.querySelectorAll('a[href^="/"]:not([href^="//"])');
    for (var i = 0; i < links.length; i++) {
      try {
        var u = new URL(links[i].getAttribute("href"), location.origin);
        if (u.searchParams.has("utm_source") || u.searchParams.has("utm_content")) continue;
        Object.keys(utm).forEach(function (k) { u.searchParams.set(k, utm[k]); });
        links[i].setAttribute("href", u.pathname + u.search + u.hash);
      } catch (e) { /* link estranho: deixa como está */ }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", repassar); else repassar();

  var h = location.hostname;
  if (!VISITAS_URL || (h !== "oceuavisa.com.br" && h !== "www.oceuavisa.com.br")) return;
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;
  try {
    var d = { p: location.pathname.replace(/index\.html$/, "") };
    [["s", "utm_source"], ["m", "utm_medium"], ["c", "utm_campaign"], ["u", "utm_content"]].forEach(function (par) {
      if (utm[par[1]]) d[par[0]] = utm[par[1]];
    });
    if (document.referrer) {
      var r = new URL(document.referrer).hostname.replace(/^www\./, "").toLowerCase();
      if (r === "oceuavisa.com.br") return; /* navegação dentro do site: não é uma nova visita */
      if (r && /^[a-z0-9.\-]{1,80}$/.test(r)) d.r = r;
    }
    /* text/plain: pedido "simples", sem preflight; keepalive deixa a mensagem sair mesmo se a pessoa fechar a aba. */
    fetch(VISITAS_URL + "/v", {
      method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(d),
      credentials: "omit", referrerPolicy: "no-referrer", keepalive: true, cache: "no-store"
    }).catch(function () {});
  } catch (e) { /* medir nunca pode quebrar a página */ }
})();
