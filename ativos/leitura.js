/* Formulário da leitura (ETAPA-32 §2.2). Único JS do site além da página de entrega.
   Sem cookie, sem localStorage, sem rastreador: nada do que a pessoa digita é guardado no navegador.
   A API fica em window.OCA_CONFIG.API_URL (ativos/config.js). Vazia = modo demonstração. */
(function () {
  "use strict";
  var CFG = window.OCA_CONFIG || {};
  var DEMO = !CFG.API_URL;
  var $ = function (id) { return document.getElementById(id); };
  var form = $("form"), resumo = $("resumo");
  var dados = null;

  if (DEMO) { $("demo").hidden = false; $("aviso-demo").hidden = false; }

  /* ---------- "não sei a hora" ---------- */
  $("semhora").addEventListener("change", function () {
    var sem = this.checked;
    $("bloco-semhora").hidden = !sem;
    $("hora").disabled = sem;
    if (sem) { $("hora").value = ""; limpa("hora"); } else { $("ciente-hora").checked = false; limpa("ciente-hora"); }
  });

  /* ---------- contadores ---------- */
  [1, 2, 3].forEach(function (n) {
    var t = $("p" + n);
    t.addEventListener("input", function () { $("c" + n).textContent = t.value.length + "/200"; $("crise").hidden = !algumaCrise(); });
  });

  /* ---------- triagem de perguntas ----------
     Triagem PRELIMINAR no navegador, só para a pessoa trocar a pergunta na hora.
     A decisão que vale é a do back-end (compliance de entrada, entrega L2): a Lambda roda
     as mesmas regras (e mais) antes de criar a cobrança, e não confia nesta checagem. */
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  var CRISE = /(suicid|me matar|vou me matar|tirar a minha vida|tirar minha vida|acabar com a minha vida|acabar com minha vida|quero morrer|nao quero mais viver|nao quero viver|me machucar|me ferir|me cortar|automutila|autolesao|ele me bate|me agride|sofrendo violencia)/;
  var BLOQUEIOS = [
    [/\b(morr(e|er|eu|erei|era|em|te)|falec\w*|obito|enterro|velorio|vai morrer|vou morrer)\b/, "morte (de quem for)"],
    [/\b(doenca\w*|cancer|tumor|diagnostic\w*|gravidez|gravida|engravid\w*|gestacao|tratamento|cirurgia|exame (medico|de sangue)|remedio|depressao|covid)\b/, "doença, diagnóstico, gravidez ou tratamento"],
    [/(processo judicial|processo (na|da) justica|processo trabalhista|processo criminal|acao judicial|ganhar a causa|ganhar o processo|sentenca|julgamento|tribunal)/, "resultado de processo judicial"],
    [/\b(aposta\w*|loteria|mega.?sena|quina|bet|bets|jogo do bicho|tigrinho|investi\w*|bitcoin|cripto\w*|acoes da bolsa|bolsa de valores|day trade)\b/, "aposta, loteria ou investimento"],
    [/\b(eleicao|eleicoes|eleitoral|quem vai ganhar a presidencia|votar em|candidato\w*)\b/, "eleição"],
    [/(menor de idade|meu filho de [0-9]{1,2} anos|minha filha de [0-9]{1,2} anos|crianca|adolescente|bebe)/, "menores de idade"]
  ];
  function temCrise(txt) { return CRISE.test(norm(txt)); }
  function algumaCrise() { return [1, 2, 3].some(function (n) { return temCrise($("p" + n).value); }); }
  function bloqueio(txt) {
    var t = norm(txt);
    for (var i = 0; i < BLOQUEIOS.length; i++) if (BLOQUEIOS[i][0].test(t)) return BLOQUEIOS[i][1];
    return null;
  }

  /* ---------- validação ---------- */
  function erro(id, msg) {
    var e = $("e-" + id), c = $(id);
    if (e) { e.textContent = msg; e.classList.add("on"); }
    if (c) c.setAttribute("aria-invalid", "true");
    return false;
  }
  function limpa(id) {
    var e = $("e-" + id), c = $(id);
    if (e) { e.textContent = ""; e.classList.remove("on"); }
    if (c) c.removeAttribute("aria-invalid");
  }
  function validar() {
    var ok = true, primeiro = null;
    function falha(id, msg) { erro(id, msg); ok = false; if (!primeiro) primeiro = id; }
    ["nome", "email", "data", "hora", "cidade", "ciente-hora", "p1", "p2", "p3", "a18", "aia", "aprazo", "aconsent"].forEach(limpa);
    var g = $("erro-geral"); g.hidden = true;

    var nome = $("nome").value.trim();
    if (nome.length < 2) falha("nome", "Diga como quer ser chamada(o).");
    var email = $("email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) falha("email", "Confira o e-mail: ele precisa ter o formato nome@exemplo.com.");

    var data = $("data").value;
    if (!data) falha("data", "Informe a data de nascimento.");
    else {
      var d = new Date(data + "T12:00:00"), hoje = new Date();
      if (isNaN(d) || d < new Date("1900-01-01T00:00:00")) falha("data", "Essa data não parece certa. Confira.");
      else if (d > hoje) falha("data", "A data de nascimento não pode ser no futuro.");
      else {
        var limite = new Date(hoje.getFullYear() - 18, hoje.getMonth(), hoje.getDate());
        if (d > limite) falha("data", "A leitura é só para maiores de 18 anos.");
      }
    }

    var sem = $("semhora").checked;
    if (!sem && !$("hora").value) falha("hora", "Informe a hora ou marque “Não sei a hora em que nasci”.");
    if (sem && !$("ciente-hora").checked) falha("ciente-hora", "Para seguir sem a hora, marque que você entendeu que a leitura fica prejudicada.");

    if ($("cidade").value.trim().length < 2) falha("cidade", "Informe a cidade de nascimento.");

    var crise = false;
    [1, 2, 3].forEach(function (n) {
      var v = $("p" + n).value.trim(), id = "p" + n;
      if (v.length < 10) { falha(id, "Escreva a pergunta (pelo menos 10 caracteres)."); return; }
      if (temCrise(v)) { crise = true; falha(id, "Não vamos fazer esta leitura. Veja o aviso abaixo e fale com alguém agora."); return; }
      var b = bloqueio(v);
      if (b) falha(id, "Esta pergunta fala de " + b + ", um assunto que a leitura não responde. Troque por outra, por exemplo pelo que você pode fazer a respeito.");
    });
    $("crise").hidden = !crise;
    if (crise) { primeiro = "crise"; }

    if (!$("a18").checked) falha("a18", "Marque que você tem 18 anos ou mais.");
    if (!$("aia").checked) falha("aia", "Marque que você entendeu que a leitura é feita por IA, para reflexão e entretenimento.");
    if (!$("aprazo").checked) falha("aprazo", "Marque que você leu o prazo e as regras de reembolso.");
    if (!$("aconsent").checked) falha("aconsent", "Sem este consentimento não conseguimos montar a leitura.");

    if (!ok) {
      g.textContent = "Faltam alguns pontos. Veja os avisos em vermelho nos campos acima.";
      g.hidden = false;
      var alvo = $(primeiro); if (alvo) { alvo.scrollIntoView({ block: "center" }); if (alvo.focus && primeiro !== "crise") alvo.focus({ preventScroll: true }); }
    }
    return ok;
  }

  function coletar() {
    var sem = $("semhora").checked;
    return {
      nome: $("nome").value.trim(),
      pronuncia: $("pron").value.trim(),
      email: $("email").value.trim(),
      nascimento: { data: $("data").value, hora: sem ? null : $("hora").value, cidade: $("cidade").value.trim() },
      sem_hora: sem,
      /* hora da confirmação "leitura prejudicada" (§2.2): o back-end deve gravar com o pedido */
      ciente_sem_hora_em: sem ? new Date().toISOString() : null,
      perguntas: [1, 2, 3].map(function (n) { return $("p" + n).value.trim(); }),
      aceites: {
        maior_18: true, ia_entretenimento: true, prazo_reembolso: true,
        consentimento_dados: true,
        novidades_email: $("anews").checked   /* caixa separada, desmarcada por padrão */
      },
      utm: utm()
    };
  }
  function utm() {
    var q = new URLSearchParams(location.search), o = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (k) { if (q.get(k)) o[k] = q.get(k).slice(0, 60); });
    return o;
  }

  /* ---------- data de entrega (agenda) ----------
     Prévia no navegador: hoje + 2 dias, no fuso de Brasília. A data que vale é a da
     agenda, que a Lambda (L6) devolve pela vaga do dia (max_por_dia) e grava no pedido. */
  function dataEntrega() {
    var d = new Date(Date.now() + 48 * 3600 * 1000);
    try { return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }); }
    catch (e) { return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2); }
  }

  /* ---------- resumo ---------- */
  function mostrarResumo(d) {
    $("r-nome").textContent = d.nome;
    $("r-email").textContent = d.email;
    var p = d.nascimento.data.split("-");
    $("r-nasc").textContent = p[2] + "/" + p[1] + "/" + p[0] + (d.sem_hora ? ", hora desconhecida" : ", às " + d.nascimento.hora);
    $("r-cidade").textContent = d.nascimento.cidade;
    $("r-aviso-hora").hidden = !d.sem_hora;
    var ol = $("r-perguntas"); ol.textContent = "";
    d.perguntas.forEach(function (q) { var li = document.createElement("li"); li.textContent = q; ol.appendChild(li); });
    $("r-preco").textContent = CFG.PRECO_LANCAMENTO || "R$ 29,90";
    $("r-entrega").textContent = dataEntrega();
    form.hidden = true; resumo.hidden = false;
    resumo.scrollIntoView({ behavior: "smooth", block: "start" });
    $("btn-pagar").focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validar()) return;
    dados = coletar();
    mostrarResumo(dados);
  });
  $("btn-editar").addEventListener("click", function () {
    resumo.hidden = true; form.hidden = false; $("erro-envio").textContent = "";
    $("btn-revisar").scrollIntoView({ block: "center" });
  });

  /* ---------- pagamento ---------- */
  $("btn-pagar").addEventListener("click", function () {
    var b = this; b.disabled = true; $("erro-envio").textContent = "";
    enviarPedido(dados).then(function (r) { location.href = r; }).catch(function (e) {
      b.disabled = false; $("erro-envio").classList.add("on");
      $("erro-envio").textContent = e && e.message ? e.message : "Não deu certo agora. Tente de novo em instantes. Nada foi cobrado.";
    });
  });

  /* PONTO DE ENTRADA DO PAGAMENTO (ETAPA-32, L6).
     Contrato esperado da Lambda `oceuavisa-pedidos`:
       POST {API_URL}/pedido   corpo = objeto de coletar()
         200 → { pedido_id, pagamento_url }   (checkout do meio de pagamento; o retorno vai para /obrigado/?p=<pedido_id>)
         422 → { crise: true } | { bloqueadas: [{ n: 1..3, motivo: "..." }] }   (compliance de entrada; nada é cobrado)
         outro → erro genérico
     O redirecionamento devolvido por esta função é para onde a pessoa vai. */
  function enviarPedido(d) {
    if (DEMO) {
      /* DEMONSTRAÇÃO: não envia nem cobra nada. Gera um número só de exemplo. */
      var n = "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      return Promise.resolve("/obrigado/?p=" + n + "&demo=1");
    }
    return fetch(CFG.API_URL + "/pedido", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d)
    }).then(function (r) {
      return r.json().then(function (j) { return { s: r.status, j: j }; });
    }).then(function (x) {
      if (x.s === 200 && x.j.pagamento_url) return x.j.pagamento_url;
      if (x.s === 422 && x.j.crise) { $("btn-editar").click(); $("crise").hidden = false; throw new Error("Não vamos fazer esta leitura. Fale com alguém agora: CVV 188."); }
      if (x.s === 422 && x.j.bloqueadas) throw new Error("Uma ou mais perguntas não podem ser respondidas. Volte, troque-as e tente de novo. Nada foi cobrado.");
      throw new Error("Não deu certo agora. Tente de novo em instantes. Nada foi cobrado.");
    });
  }
})();
