/**
 * Utilitário para integração com QZ Tray para impressão de comandas
 * Adaptado do sistema original da pizzaria
 */

// Função para conectar ao QZ Tray
export const conectarQZTray = async () => {
  try {
    if (typeof qz === 'undefined') {
      console.error('QZ Tray não está disponível. Verifique se o script foi carregado corretamente.');
      return false;
    }

    if (!qz.websocket.isActive()) {
      await qz.websocket.connect();
      console.log('Conectado ao QZ Tray com sucesso');
      return true;
    } else {
      console.log('Já conectado ao QZ Tray');
      return true;
    }
  } catch (error) {
    console.error('Erro ao conectar ao QZ Tray:', error);
    return false;
  }
};

// Função para obter impressoras disponíveis
export const obterImpressoras = async () => {
  try {
    if (typeof qz === 'undefined') {
      console.error('QZ Tray não está disponível');
      return [];
    }

    if (!qz.websocket.isActive()) {
      await conectarQZTray();
    }

    const impressoras = await qz.printers.find();
    return impressoras || [];
  } catch (error) {
    console.error('Erro ao obter impressoras:', error);
    return [];
  }
};

// Função para imprimir comanda
export const imprimirComanda = async (impressora, conteudo, copias = 1) => {
  try {
    if (typeof qz === 'undefined') {
      throw new Error('QZ Tray não está disponível');
    }

    if (!qz.websocket.isActive()) {
      await conectarQZTray();
    }

    // Configuração para impressora térmica
    const config = qz.configs.create(impressora, {
      altPrinting: false,
      encoding: "UTF-8",
      copies: copias
    });

    // Enviar para impressão
    await qz.print(config, conteudo);
    return true;
  } catch (error) {
    console.error('Erro ao imprimir comanda:', error);
    throw error;
  }
};

// Função para formatar comanda para impressão (via de controle)
export const formatarComandaControle = (pedidoData) => {
  const { pedido, itens, cliente, mesa, data } = pedidoData;
  
  // Formatar data
  const dataFormatada = new Date(data).toLocaleString('pt-BR');
  
  // Cabeçalho
  let conteudo = [
    "\x1B\x40",  // Inicializar impressora
    "\x1B\x45\x01",  // Negrito ligado
    "\x1B\x61\x01",  // Centralizado
    "PIZZARIA V0\n",
    "\x1B\x45\x00",  // Negrito desligado
    "COMANDA DE PEDIDO - CONTROLE\n",
    `Data: ${dataFormatada}\n`,
    `Pedido #${pedido.id}\n`,
    "\x1B\x61\x00",  // Alinhamento à esquerda
    "-".repeat(42) + "\n"
  ];
  
  // Informações do cliente/mesa
  if (cliente) {
    conteudo.push(`Cliente: ${cliente.nome}\n`);
    if (cliente.telefone) conteudo.push(`Telefone: ${cliente.telefone}\n`);
  }
  
  if (mesa) {
    conteudo.push(`Mesa: ${mesa.numero}\n`);
  }
  
  conteudo.push("-".repeat(42) + "\n");
  
  // Itens do pedido
  conteudo.push("\x1B\x45\x01ITENS DO PEDIDO:\x1B\x45\x00\n");
  
  itens.forEach(item => {
    conteudo.push(`${item.quantidade}x ${item.nome}\n`);
    conteudo.push(`   R$ ${(item.preco * item.quantidade).toFixed(2)}\n`);
    if (item.observacao) conteudo.push(`   Obs: ${item.observacao}\n`);
  });
  
  conteudo.push("-".repeat(42) + "\n");
  
  // Total e forma de pagamento
  conteudo.push(`\x1B\x45\x01TOTAL: R$ ${pedido.valorTotal.toFixed(2)}\x1B\x45\x00\n`);
  if (pedido.formaPagamento) {
    conteudo.push(`Forma de Pagamento: ${pedido.formaPagamento}\n`);
  }
  
  // Observações gerais
  if (pedido.observacao) {
    conteudo.push("-".repeat(42) + "\n");
    conteudo.push("Observações:\n");
    conteudo.push(`${pedido.observacao}\n`);
  }
  
  // Rodapé
  conteudo.push("-".repeat(42) + "\n");
  conteudo.push("\x1B\x61\x01");  // Centralizado
  conteudo.push("Obrigado pela preferência!\n\n\n\n");
  conteudo.push("\x1B\x69");  // Cortar papel
  
  return conteudo;
};

// Função para formatar comanda para impressão (via da cozinha)
export const formatarComandaCozinha = (pedidoData) => {
  const { pedido, itens, mesa, data } = pedidoData;
  
  // Formatar data
  const dataFormatada = new Date(data).toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Cabeçalho
  let conteudo = [
    "\x1B\x40",  // Inicializar impressora
    "\x1B\x45\x01",  // Negrito ligado
    "\x1B\x61\x01",  // Centralizado
    "PIZZARIA V0 - COZINHA\n",
    "\x1B\x21\x30",  // Fonte grande
    `PEDIDO #${pedido.id}\n`,
    "\x1B\x21\x00",  // Fonte normal
    `Hora: ${dataFormatada}\n`,
    "\x1B\x61\x00",  // Alinhamento à esquerda
    "-".repeat(42) + "\n"
  ];
  
  // Mesa (se aplicável)
  if (mesa) {
    conteudo.push("\x1B\x45\x01");  // Negrito ligado
    conteudo.push(`MESA: ${mesa.numero}\n`);
    conteudo.push("\x1B\x45\x00");  // Negrito desligado
    conteudo.push("-".repeat(42) + "\n");
  }
  
  // Itens do pedido
  conteudo.push("\x1B\x45\x01ITENS:\x1B\x45\x00\n\n");
  
  itens.forEach(item => {
    conteudo.push("\x1B\x45\x01");  // Negrito ligado
    conteudo.push(`${item.quantidade}x ${item.nome}\n`);
    conteudo.push("\x1B\x45\x00");  // Negrito desligado
    if (item.observacao) conteudo.push(`   OBS: ${item.observacao}\n`);
    conteudo.push("\n");
  });
  
  // Observações gerais
  if (pedido.observacao) {
    conteudo.push("-".repeat(42) + "\n");
    conteudo.push("\x1B\x45\x01OBSERVAÇÕES:\x1B\x45\x00\n");
    conteudo.push(`${pedido.observacao}\n`);
  }
  
  // Rodapé
  conteudo.push("-".repeat(42) + "\n");
  conteudo.push("\x1B\x61\x01");  // Centralizado
  conteudo.push("\n\n\n");
  conteudo.push("\x1B\x69");  // Cortar papel
  
  return conteudo;
};
