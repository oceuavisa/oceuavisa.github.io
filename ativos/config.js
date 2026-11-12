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

  PRECO_LANCAMENTO: "R$ 29,90",
  PRECO_CHEIO: "R$ 49,90"
};
/* compatibilidade com o interruptor antigo */
window.OCA_CONFIG.VENDA_ABERTA = window.OCA_CONFIG.MODO === "aberta";

/* Sem este script o site fica no modo seguro: sem venda e sem lista (data-venda ausente = fechada). */
document.documentElement.setAttribute("data-venda",
  ["aberta", "espera"].indexOf(window.OCA_CONFIG.MODO) >= 0 ? window.OCA_CONFIG.MODO : "fechada");
