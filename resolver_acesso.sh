#!/bin/bash

# 🔧 Script de Resolução de Problemas de Acesso
# JáPede Cardápio - Sistema de Gestão para Restaurantes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}"
echo "🔧 =================================="
echo "   Resolver Problemas de Acesso"
echo "   JáPede Cardápio"
echo "===================================="
echo -e "${NC}"

# Verificar se estamos no diretório correto
if [[ ! -f "package.json" ]]; then
    log_error "Este script deve ser executado no diretório raiz do projeto japede-cardapio"
    exit 1
fi

log_info "Iniciando diagnóstico e correção de problemas de acesso..."

# 1. Verificar e instalar dependências
log_info "1. Verificando dependências..."
if [[ ! -d "node_modules" ]]; then
    log_warning "node_modules não encontrado. Instalando dependências..."
    npm install
    log_success "Dependências instaladas"
else
    log_success "Dependências já instaladas"
fi

# 2. Verificar configuração do Supabase
log_info "2. Verificando configuração do Supabase..."
if [[ ! -f ".env.local" ]]; then
    log_warning "Arquivo .env.local não encontrado. Criando configuração padrão..."
    cat > .env.local << 'EOF'
# Configuração do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico-aqui

# Configuração de Produção
NODE_ENV=development
VITE_APP_ENV=development
EOF
    log_warning "Arquivo .env.local criado com valores padrão"
    log_warning "IMPORTANTE: Edite o arquivo .env.local com suas credenciais do Supabase"
else
    log_success "Arquivo .env.local encontrado"
fi

# 3. Verificar se o build funciona
log_info "3. Testando build do projeto..."
if npm run build > /dev/null 2>&1; then
    log_success "Build executado com sucesso"
else
    log_warning "Problemas no build detectados. Aplicando correções..."
    # Aplicar correções se o script de correção existir
    if [[ -f "corrigir_erros_build.sh" ]]; then
        bash corrigir_erros_build.sh
    fi
fi

# 4. Criar script de inicialização do banco
log_info "4. Criando script de inicialização do banco..."
cat > init_database.sql << 'EOF'
-- Script de inicialização do banco de dados
-- Execute este script no seu Supabase SQL Editor

-- Criar tabela de profiles (usuários)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de itens do menu
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados iniciais
INSERT INTO categories (name, description) VALUES 
('Pizzas', 'Pizzas tradicionais e especiais'),
('Bebidas', 'Refrigerantes, sucos e bebidas')
ON CONFLICT DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas
CREATE POLICY "Profiles são visíveis para usuários autenticados" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Categorias são visíveis para todos" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Menu items são visíveis para todos" ON menu_items
    FOR SELECT USING (true);
EOF

log_success "Script de inicialização do banco criado: init_database.sql"

# 5. Criar script de criação de administrador
log_info "5. Criando script de criação de administrador..."
cat > criar_admin.js << 'EOF'
// Script para criar administrador inicial
// Execute com: node criar_admin.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não configuradas no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarAdmin() {
    try {
        console.log('🔧 Criando administrador inicial...');
        
        // Criar usuário
        const { data: user, error: authError } = await supabase.auth.admin.createUser({
            email: 'admin@japede.com',
            password: '123456',
            email_confirm: true
        });

        if (authError) {
            console.error('❌ Erro ao criar usuário:', authError.message);
            return;
        }

        // Criar perfil
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.user.id,
                email: 'admin@japede.com',
                full_name: 'Administrador',
                role: 'super_admin'
            });

        if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError.message);
            return;
        }

        console.log('✅ Administrador criado com sucesso!');
        console.log('📧 Email: admin@japede.com');
        console.log('🔑 Senha: 123456');
        console.log('⚠️  Altere a senha após o primeiro login');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

criarAdmin();
EOF

log_success "Script de criação de administrador criado: criar_admin.js"

# 6. Criar script de teste de conexão
log_info "6. Criando script de teste de conexão..."
cat > testar_conexao.js << 'EOF'
// Script para testar conexão com Supabase
// Execute com: node testar_conexao.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Credenciais do Supabase não configuradas');
    console.log('📝 Edite o arquivo .env.local com suas credenciais');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testarConexao() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Erro de conexão:', error.message);
            console.log('💡 Verifique se:');
            console.log('   - As credenciais estão corretas');
            console.log('   - O banco foi inicializado (execute init_database.sql)');
            console.log('   - As políticas RLS estão configuradas');
        } else {
            console.log('✅ Conexão com Supabase funcionando!');
            console.log('📊 Dados encontrados:', data?.length || 0, 'registros');
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testarConexao();
EOF

log_success "Script de teste de conexão criado: testar_conexao.js"

# 7. Instalar dependência dotenv se necessário
log_info "7. Verificando dependência dotenv..."
if ! npm list dotenv > /dev/null 2>&1; then
    log_info "Instalando dotenv..."
    npm install dotenv
fi

# 8. Criar script de inicialização completa
log_info "8. Criando script de inicialização completa..."
cat > inicializar_sistema.sh << 'EOF'
#!/bin/bash

echo "🚀 Inicializando Sistema JáPede Cardápio..."

# 1. Testar conexão
echo "1. Testando conexão com Supabase..."
node testar_conexao.js

# 2. Criar administrador (se necessário)
echo "2. Criando administrador inicial..."
node criar_admin.js

# 3. Iniciar servidor de desenvolvimento
echo "3. Iniciando servidor..."
npm run dev
EOF

chmod +x inicializar_sistema.sh
log_success "Script de inicialização criado: inicializar_sistema.sh"

echo
echo -e "${GREEN}🎉 Resolução de problemas concluída!${NC}"
echo
log_info "Próximos passos:"
log_info "1. Edite o arquivo .env.local com suas credenciais do Supabase"
log_info "2. Execute o script init_database.sql no Supabase SQL Editor"
log_info "3. Execute: node testar_conexao.js"
log_info "4. Execute: node criar_admin.js"
log_info "5. Execute: npm run dev"
echo
log_warning "Credenciais padrão do administrador:"
log_warning "Email: admin@japede.com"
log_warning "Senha: 123456"

