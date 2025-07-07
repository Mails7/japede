# 🍕 Guia de Instalação - JáPede Cardápio VPS

## Versão 2.0 - Script Corrigido e Otimizado

Este guia fornece instruções completas para instalar o sistema JáPede Cardápio em sua VPS usando o script de instalação corrigido.

---

## 📋 Pré-requisitos

### Servidor VPS
- **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
- **RAM**: Mínimo 1GB (recomendado 2GB+)
- **Armazenamento**: Mínimo 10GB livres
- **Acesso**: SSH com privilégios root ou sudo

### Dados do Supabase
Antes de iniciar, tenha em mãos:
- ✅ URL do projeto Supabase (ex: `https://abc.supabase.co`)
- ✅ Chave anônima (Anon Key)
- ✅ Chave de serviço (Service Role Key) - opcional mas recomendada

### Domínio (Opcional)
- Domínio configurado apontando para o IP da VPS
- Ou use diretamente o IP da VPS (ex: `157.180.78.134`)

---

## 🚀 Instalação Rápida

### Passo 1: Conectar na VPS
```bash
ssh root@157.180.78.134
# ou
ssh usuario@157.180.78.134
sudo su -
```

### Passo 2: Baixar o Script
```bash
wget https://raw.githubusercontent.com/Mails7/japede-cardapio/main/install_japede_vps.sh
# ou se preferir usar curl:
curl -O https://raw.githubusercontent.com/Mails7/japede-cardapio/main/install_japede_vps.sh
```

### Passo 3: Executar a Instalação
```bash
chmod +x install_japede_vps.sh
sudo bash install_japede_vps.sh
```

### Passo 4: Seguir as Instruções
O script irá solicitar as seguintes informações:

1. **Domínio ou IP**: `157.180.78.134` ou `meudominio.com`
2. **URL do Supabase**: `https://seu-projeto.supabase.co`
3. **Chave Anônima**: Sua chave anônima do Supabase
4. **Chave de Serviço**: Sua chave de serviço (opcional)
5. **Repositório Git**: Pressione Enter para usar o padrão
6. **Diretório**: Pressione Enter para usar `/var/www/japede-cardapio`
7. **SSL**: Digite `y` se tiver domínio próprio, `n` se usar IP

---

## 📝 Exemplo de Execução

```bash
root@vps:~# bash install_japede_vps.sh

🍕 ==================================
   JáPede Cardápio - Instalador VPS
   Versão 2.0 - Corrigida
====================================

[INFO] Sistema detectado: Ubuntu 22.04
[STEP] === Configuração da Instalação ===

Domínio ou IP do servidor (ex: meusite.com ou 157.180.78.134): 157.180.78.134
URL do Supabase (ex: https://abc.supabase.co): https://meu-projeto.supabase.co
Chave anônima do Supabase: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Chave de serviço do Supabase (opcional, para configuração automática do DB): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
URL do repositório Git [https://github.com/Mails7/japede-cardapio.git]: 
Diretório de instalação [/var/www/japede-cardapio]: 
[INFO] SSL será desabilitado (IP ou domínio local detectado)

=== Resumo da Configuração ===
  Domínio/IP: 157.180.78.134
  Supabase URL: https://meu-projeto.supabase.co
  Repositório: https://github.com/Mails7/japede-cardapio.git
  Diretório: /var/www/japede-cardapio
  SSL: false

Continuar com essa configuração? (y/N): y

[STEP] Atualizando sistema...
[SUCCESS] Sistema atualizado
[STEP] Instalando Node.js LTS...
[INFO] Node.js instalado: v20.11.0
[INFO] NPM instalado: 10.2.4
[SUCCESS] Node.js configurado
...
```

---

## 🔧 Configurações Específicas

### Para IP Direto (157.180.78.134)
```bash
Domínio ou IP: 157.180.78.134
SSL: n (não configurar SSL)
```

### Para Domínio Próprio
```bash
Domínio ou IP: meurestaurante.com
SSL: y (configurar SSL)
Email para SSL: admin@meurestaurante.com
```

---

## 📊 Após a Instalação

### Verificar Status
```bash
cd /var/www/japede-cardapio
./status.sh
```

### Acessar o Sistema
- **Com IP**: `http://157.180.78.134`
- **Com domínio**: `http://meudominio.com` ou `https://meudominio.com`

### Scripts Úteis Criados
```bash
# Verificar status do sistema
./status.sh

# Atualizar aplicação
./update.sh

# Fazer backup
./backup.sh
```

---

## 🛠️ Comandos de Manutenção

### Nginx
```bash
# Status do Nginx
systemctl status nginx

# Recarregar configuração
systemctl reload nginx

# Reiniciar Nginx
systemctl restart nginx

# Ver logs
tail -f /var/log/nginx/japede-cardapio.error.log
```

### Firewall
```bash
# Status do firewall
ufw status

# Permitir nova porta
ufw allow 8080/tcp
```

### Sistema
```bash
# Verificar espaço em disco
df -h

# Verificar memória
free -h

# Verificar processos
top
```

---

## 🔍 Solução de Problemas

### Problema: Site não carrega
**Soluções:**
1. Verificar se Nginx está rodando: `systemctl status nginx`
2. Verificar logs: `tail -f /var/log/nginx/japede-cardapio.error.log`
3. Verificar se o build existe: `ls -la /var/www/japede-cardapio/dist/`

### Problema: Erro de conexão com Supabase
**Soluções:**
1. Verificar URL do Supabase no arquivo `.env.local`
2. Testar conexão: `curl -I https://seu-projeto.supabase.co`
3. Verificar chaves no painel do Supabase

### Problema: SSL não funciona
**Soluções:**
1. Verificar se DNS aponta para o servidor: `nslookup meudominio.com`
2. Tentar configurar SSL manualmente: `certbot --nginx -d meudominio.com`
3. Verificar logs do Certbot: `tail -f /var/log/letsencrypt/letsencrypt.log`

### Problema: Permissões negadas
**Soluções:**
1. Corrigir permissões: `chown -R www-data:www-data /var/www/japede-cardapio`
2. Verificar permissões: `ls -la /var/www/japede-cardapio/`

---

## 📋 Checklist Pós-Instalação

- [ ] ✅ Site carrega corretamente
- [ ] ✅ Login administrativo funciona
- [ ] ✅ Conexão com Supabase estabelecida
- [ ] ✅ Banco de dados configurado
- [ ] ✅ SSL configurado (se aplicável)
- [ ] ✅ Firewall configurado
- [ ] ✅ Scripts de manutenção testados
- [ ] ✅ Backup inicial criado

---

## 🔄 Atualizações Futuras

Para atualizar o sistema:
```bash
cd /var/www/japede-cardapio
./update.sh
```

---

## 📞 Suporte

### Logs Importantes
- **Nginx**: `/var/log/nginx/japede-cardapio.error.log`
- **Sistema**: `/var/log/syslog`
- **SSL**: `/var/log/letsencrypt/letsencrypt.log`

### Arquivos de Configuração
- **Nginx**: `/etc/nginx/sites-available/japede-cardapio`
- **Aplicação**: `/var/www/japede-cardapio/.env.local`
- **Firewall**: `ufw status numbered`

---

## 🎯 Melhorias Recomendadas

### Segurança
1. **Configurar backup automático**:
   ```bash
   (crontab -l; echo "0 2 * * * /var/www/japede-cardapio/backup.sh") | crontab -
   ```

2. **Monitoramento de logs**:
   ```bash
   apt install logwatch
   ```

3. **Fail2ban para proteção SSH**:
   ```bash
   apt install fail2ban
   ```

### Performance
1. **Configurar cache Redis** (opcional)
2. **Otimizar configuração do Nginx**
3. **Configurar CDN** para assets estáticos

---

## 📄 Informações do Script

### O que o script faz:
1. ✅ Atualiza o sistema operacional
2. ✅ Instala Node.js LTS via NodeSource
3. ✅ Instala e configura Nginx
4. ✅ Configura firewall (UFW)
5. ✅ Clona o repositório do projeto
6. ✅ Instala dependências e faz build
7. ✅ Configura variáveis de ambiente
8. ✅ Configura Nginx para o projeto
9. ✅ Configura SSL (se solicitado)
10. ✅ Tenta configurar banco de dados
11. ✅ Cria scripts de manutenção
12. ✅ Verifica a instalação

### Melhorias da versão 2.0:
- ✅ Detecção automática do sistema operacional
- ✅ Validação de entrada do usuário
- ✅ Melhor tratamento de erros
- ✅ Configuração otimizada do Nginx
- ✅ Scripts de manutenção aprimorados
- ✅ Verificação pós-instalação
- ✅ Logs mais detalhados
- ✅ Suporte melhorado para IP direto

---

**🎉 Pronto! Seu sistema JáPede Cardápio está instalado e funcionando!**

