/* ÚNICO lugar para configurar o site e a ligação com o back-end (ETAPA-32, L6 e lista de espera).
   Não guarde segredo aqui: este arquivo é público. */
window.OCA_CONFIG = {
  /* MODO DO SITE — a chave que vira a página da leitura sem refazer nada:
     "espera"  = a leitura é apresentada e /leitura/ recolhe e-mails na lista de espera (sem preço fechado
                 de compra, sem botão de compra, sem formulário de pedido). É o modo de agora (decisão de 12/11).
     "aberta"  = venda aberta: preço, botões de compra e o formulário do pedido aparecem; a lista some.
                 Só quando a Lambda de pedidos, a conta PJ e o cadastro da atividade estiverem prontas.
     "fechada" = nem venda nem lista: /leitura/ diz "ainda não abrimos". */
  MODO: "espera",

  /* Function URL da Lambda `oceuavisa-pedidos` (https, sem barra no fim). Vazia = formulário do pedido
     em MODO DEMONSTRAÇÃO (valida e vai para /obrigado/ sem enviar nem cobrar). */
  API_URL: "",

  /* Function URL da Lambda `oceuavisa-lista-espera` (https, sem barra no fim), impressa pelo
     `ferramentas/leitura/aws/implantar.sh tudo`. Vazia = a lista em MODO DEMONSTRAÇÃO (nada é enviado). */
  LISTA_URL: "https://hpcwv4ieyo7z4o5dle4eyhbgri0gpqxp.lambda-url.us-east-1.on.aws",  /* implantada em 12/11/2026 */

  /* PREÇO NAS PÁGINAS (decisão pendente do Eduardo, ver README "Preço e pagamento"):
     "mostrar"  = /leitura/, Perguntas e Obrigado citam o preço previsto (R$ 29,90) e o pagamento.
     "esconder" = essas menções somem e entra um texto neutro ("o valor será informado quando os pedidos abrirem"). */
  PRECO: "mostrar",

  /* CUPOM DE FUNDADOR da lista de espera (decisão de 20/11): quem entra na lista ganha um código na hora, e a
     primeira leitura sai por PRECO_LANCAMENTO em vez de PRECO_CHEIO (preço aprovado em 11/11).
     Trocar o preço = mudar PRECO_CHEIO/PRECO_LANCAMENTO aqui E PRECO_CHEIO/PRECO_CUPOM em
     ferramentas/leitura/aws/lista_espera.py (a Lambda grava o preço no cupom; a tela de obrigado mostra o dela).
     /leitura/ troca os números sozinha; a home (index.html) e privacidade.html (30 dias) têm o número
     escrito no HTML: `grep -n "cupom\|29,90" index.html privacidade.html` e troque lá também. */
  CUPOM_DIAS: 30,     /* validade: dias depois da abertura dos pedidos */

  PRECO_LANCAMENTO: "R$ 29,90",
  PRECO_CHEIO: "R$ 49,90"
};
/* compatibilidade com o interruptor antigo */
window.OCA_CONFIG.VENDA_ABERTA = window.OCA_CONFIG.MODO === "aberta";

document.documentElement.setAttribute("data-preco", window.OCA_CONFIG.PRECO === "esconder" ? "esconder" : "mostrar");

/* Sem este script o site fica no modo seguro: sem venda e sem lista (data-venda ausente = fechada). */
document.documentElement.setAttribute("data-venda",
  ["aberta", "espera"].indexOf(window.OCA_CONFIG.MODO) >= 0 ? window.OCA_CONFIG.MODO : "fechada");
