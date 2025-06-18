# JáPede - Sistema de Pedidos Online

Sistema completo de gerenciamento de pedidos online com interface moderna e funcionalidades avançadas.

## 🚀 Funcionalidades

- **Autenticação de Usuários**: Sistema completo de login/registro
- **Gerenciamento de Pedidos**: Criação, edição e acompanhamento de pedidos
- **Interface do Cliente**: Cardápio digital para clientes
- **Dashboard Administrativo**: Painel completo para gestão
- **Configurações Flexíveis**: Sistema de configurações personalizáveis
- **Integração com IA**: Geração automática de descrições
- **Tempo Real**: Atualizações em tempo real via Supabase

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: Tailwind CSS
- **IA**: Google Gemini (via Supabase Edge Functions)

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase
- Chave da API do Google Gemini

## 🔧 Instalação

### **Opção 1: Instalação Local**

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd japed
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# API Keys
VITE_GEMINI_API_KEY=sua_chave_do_gemini

# Database Configuration (para scripts)
DATABASE_URL=postgresql://postgres:password@localhost:5432/japed
NODE_ENV=development
```

4. **Configure o banco de dados**
```bash
# Execute as migrações
npm run db:migrate

# Popule com dados iniciais
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

### **Opção 2: Instalação na VPS**

1. **Acesse sua VPS via SSH**
```bash
ssh usuario@seu-ip-vps
```

2. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd japed
```

3. **Instale as dependências**
```bash
npm install
```

4. **Configure as variáveis de ambiente**
```bash
nano .env
```

Adicione as seguintes variáveis:
```env
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase

# API Keys
VITE_GEMINI_API_KEY=sua_chave_do_gemini

# Application Settings
VITE_APP_NAME=JáPede
VITE_APP_DESCRIPTION=Sistema de pedidos online
```

5. **Configure o Supabase (Método Recomendado)**

**A. Via SQL Editor do Supabase:**
- Acesse o painel do Supabase
- Vá para SQL Editor
- Execute o conteúdo do arquivo `database-setup.sql`

**B. Via Script Automático:**
```bash
node setup-supabase.js
```

6. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run preview
```

## 🗄️ Configuração do Supabase

### 1. Crie um novo projeto no Supabase

### 2. Configure as políticas RLS (Row Level Security)

Execute as seguintes políticas no SQL Editor do Supabase:

```sql
-- Habilita RLS nas tabelas
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para app_settings
CREATE POLICY "Usuários autenticados podem ler configurações"
ON app_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem atualizar configurações"
ON app_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir inserção de configurações padrão"
ON app_settings FOR INSERT
TO authenticated
WITH CHECK (id = 'default_settings');

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 3. Configure a Edge Function para Gemini

Crie uma Edge Function no Supabase para integrar com a API do Gemini.

## 📱 Uso

### Modo Administrador
- Acesse `/admin` para o painel administrativo
- Gerencie pedidos, produtos e configurações
- Monitore vendas e relatórios

### Modo Cliente
- Acesse `/customer` para o cardápio digital
- Faça pedidos online
- Acompanhe o status dos pedidos

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento (porta 3001)
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run db:migrate` - Executa migrações do banco
- `npm run db:seed` - Popula o banco com dados iniciais
- `npm run db:reset` - Reseta o banco de dados

## 🌐 URLs de Acesso

- **Local**: `http://localhost:3001`
- **Rede Local**: `http://192.168.x.x:3001`
- **VPS**: `http://seu-ip-vps:3001`

## 🐛 Solução de Problemas

### Erro de conexão com Supabase
- Verifique se as variáveis de ambiente estão configuradas
- Confirme se as políticas RLS estão aplicadas
- Teste a conexão no painel do Supabase

### Erro de migração na VPS
- Use o arquivo `database-setup.sql` no SQL Editor do Supabase
- Ou execute `node setup-supabase.js` com a chave de serviço

### Erro de porta em uso
- O sistema usa a porta 3001 por padrão
- Se necessário, altere em `vite.config.ts`

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.
