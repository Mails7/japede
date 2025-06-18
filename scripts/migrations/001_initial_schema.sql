-- Criação da tabela de configurações
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    settings_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas mais rápidas
CREATE INDEX IF NOT EXISTS idx_app_settings_id ON app_settings(id);

-- Habilita RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Política para leitura de configurações
CREATE POLICY "Usuários autenticados podem ler configurações"
ON app_settings FOR SELECT
TO authenticated
USING (true);

-- Política para atualização de configurações
CREATE POLICY "Usuários autenticados podem atualizar configurações"
ON app_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para inserção de configurações padrão
CREATE POLICY "Permitir inserção de configurações padrão"
ON app_settings FOR INSERT
TO authenticated
WITH CHECK (id = 'default_settings');

-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para perfis
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Habilita RLS para perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 