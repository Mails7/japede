import React, { useState, useEffect } from 'react';
import { Button } from '../../src/components/ui/button';
import { Printer, Check, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { conectarQZTray, obterImpressoras, imprimirComanda, formatarComandaControle, formatarComandaCozinha } from '../../utils/qzTrayHelper';
import { useAppContext } from '../../contexts/AppContext';

const ImpressaoComandaComponent = ({ pedidoData }) => {
  const [impressoras, setImpressoras] = useState([]);
  const [impressoraSelecionada, setImpressoraSelecionada] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [mensagem, setMensagem] = useState('');
  const [qzDisponivel, setQzDisponivel] = useState(false);
  const { setAlert } = useAppContext();

  // Verificar disponibilidade do QZ Tray ao carregar o componente
  useEffect(() => {
    const verificarQZ = async () => {
      try {
        if (typeof qz !== 'undefined') {
          setQzDisponivel(true);
          const conectado = await conectarQZTray();
          if (conectado) {
            carregarImpressoras();
          }
        } else {
          setQzDisponivel(false);
          setMensagem('QZ Tray não está instalado ou não foi carregado corretamente.');
        }
      } catch (error) {
        console.error('Erro ao verificar QZ Tray:', error);
        setQzDisponivel(false);
        setMensagem('Erro ao verificar QZ Tray. Verifique se está instalado corretamente.');
      }
    };

    verificarQZ();
  }, []);

  // Carregar lista de impressoras disponíveis
  const carregarImpressoras = async () => {
    try {
      setStatus('loading');
      const listaImpressoras = await obterImpressoras();
      setImpressoras(listaImpressoras);
      
      if (listaImpressoras.length > 0) {
        // Tentar encontrar uma impressora térmica comum
        const impressoraTermica = listaImpressoras.find(imp => 
          imp.toLowerCase().includes('thermal') || 
          imp.toLowerCase().includes('térmica') || 
          imp.toLowerCase().includes('bematech') ||
          imp.toLowerCase().includes('epson') ||
          imp.toLowerCase().includes('pos')
        );
        
        if (impressoraTermica) {
          setImpressoraSelecionada(impressoraTermica);
        } else {
          setImpressoraSelecionada(listaImpressoras[0]);
        }
      }
      
      setStatus('idle');
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
      setStatus('error');
      setMensagem('Erro ao carregar impressoras. Verifique se o QZ Tray está em execução.');
    }
  };

  // Imprimir comanda
  const handleImprimirComanda = async () => {
    if (!impressoraSelecionada) {
      setAlert({ 
        message: 'Selecione uma impressora para continuar.', 
        type: 'info' 
      });
      return;
    }

    try {
      setStatus('loading');
      setMensagem('Enviando comanda para impressão...');

      // Imprimir via de controle
      const conteudoControle = formatarComandaControle(pedidoData);
      await imprimirComanda(impressoraSelecionada, conteudoControle);
      
      // Imprimir via da cozinha
      const conteudoCozinha = formatarComandaCozinha(pedidoData);
      await imprimirComanda(impressoraSelecionada, conteudoCozinha);
      
      setStatus('success');
      setMensagem('Comanda enviada para impressão com sucesso!');
      setAlert({ 
        message: 'Comanda enviada para impressão com sucesso!', 
        type: 'success' 
      });
      
      // Resetar status após 3 segundos
      setTimeout(() => {
        setStatus('idle');
        setMensagem('');
      }, 3000);
    } catch (error) {
      console.error('Erro ao imprimir comanda:', error);
      setStatus('error');
      setMensagem(`Erro ao imprimir: ${error.message || 'Falha na comunicação com a impressora'}`);
      setAlert({ 
        message: `Erro ao imprimir: ${error.message || 'Falha na comunicação com a impressora'}`, 
        type: 'error' 
      });
    }
  };

  // Renderizar mensagem de instalação do QZ Tray
  if (!qzDisponivel) {
    return (
      <div className="border rounded-lg p-4 bg-yellow-50 text-yellow-800">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">QZ Tray não detectado</h3>
        </div>
        <p className="text-sm mb-3">Para imprimir comandas, é necessário instalar o QZ Tray:</p>
        <ol className="text-sm list-decimal pl-5 mb-3 space-y-1">
          <li>Acesse <a href="https://qz.io/download/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">qz.io/download</a></li>
          <li>Baixe e instale o QZ Tray para seu sistema operacional</li>
          <li>Reinicie o navegador após a instalação</li>
          <li>Recarregue esta página</li>
        </ol>
        <p className="text-sm italic">O QZ Tray é necessário para comunicação com impressoras térmicas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Select
          value={impressoraSelecionada}
          onValueChange={setImpressoraSelecionada}
          disabled={status === 'loading'}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Selecione uma impressora" />
          </SelectTrigger>
          <SelectContent>
            {impressoras.length === 0 ? (
              <SelectItem value="no-printers" disabled>
                Nenhuma impressora encontrada
              </SelectItem>
            ) : (
              impressoras.map((impressora, index) => (
                <SelectItem key={index} value={impressora}>
                  {impressora}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button
          onClick={handleImprimirComanda}
          disabled={!impressoraSelecionada || status === 'loading'}
          className="flex items-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Imprimindo...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Imprimir Comanda (2 vias)
            </>
          )}
        </Button>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <Check className="h-4 w-4" />
          {mensagem}
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-600 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {mensagem}
          </div>
          <Button
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={carregarImpressoras}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImpressaoComandaComponent;
