-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS JÁPEDE
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criação da tabela de configurações
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    settings_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas mais rápidas
CREATE INDEX IF NOT EXISTS idx_app_settings_id ON app_settings(id);

-- 2. Criação da tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para perfis
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 3. Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Trigger para atualizar o timestamp
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para app_settings
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

-- 7. Políticas para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 8. Inserir configurações padrão
INSERT INTO app_settings (id, settings_data) VALUES (
    'default_settings',
    '{
        "store": {
            "name": "JáPede",
            "description": "Sistema de pedidos online",
            "logo_url": null,
            "theme": {
                "primary_color": "#F97316",
                "secondary_color": "#2196F3",
                "accent_color": "#4CAF50"
            }
        },
        "payments": {
            "enabled_methods": ["credit_card", "pix"],
            "pix_key": null,
            "pix_key_type": null
        },
        "whatsapp": {
            "notify_order_confirmation": true,
            "notify_order_ready": false,
            "notify_order_out_for_delivery": false,
            "phone_number_id": null,
            "phone_display_number": null
        },
        "notifications": {
            "sound_alert_new_order_admin": true,
            "email_admin_new_order": null
        }
    }'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 