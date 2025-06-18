#!/usr/bin/env node

/**
 * Script de Configuração do Supabase para JáPede
 * Este script configura as tabelas e políticas no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave de serviço para admin

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}

// Cliente com chave de serviço para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados...');

  try {
    // 1. Criar tabela app_settings
    console.log('📋 Criando tabela app_settings...');
    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS app_settings (
          id TEXT PRIMARY KEY,
          settings_data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_app_settings_id ON app_settings(id);
      `
    });

    if (settingsError) {
      console.log('⚠️  Tabela app_settings já existe ou erro:', settingsError.message);
    } else {
      console.log('✅ Tabela app_settings criada com sucesso');
    }

    // 2. Criar tabela profiles
    console.log('👤 Criando tabela profiles...');
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          full_name TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
      `
    });

    if (profilesError) {
      console.log('⚠️  Tabela profiles já existe ou erro:', profilesError.message);
    } else {
      console.log('✅ Tabela profiles criada com sucesso');
    }

    // 3. Habilitar RLS
    console.log('🔒 Habilitando RLS...');
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      `
    });

    // 4. Criar políticas
    console.log('📜 Criando políticas de segurança...');
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Usuários autenticados podem ler configurações" ON app_settings;
        CREATE POLICY "Usuários autenticados podem ler configurações"
        ON app_settings FOR SELECT
        TO authenticated
        USING (true);

        DROP POLICY IF EXISTS "Usuários autenticados podem atualizar configurações" ON app_settings;
        CREATE POLICY "Usuários autenticados podem atualizar configurações"
        ON app_settings FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);

        DROP POLICY IF EXISTS "Permitir inserção de configurações padrão" ON app_settings;
        CREATE POLICY "Permitir inserção de configurações padrão"
        ON app_settings FOR INSERT
        TO authenticated
        WITH CHECK (id = 'default_settings');
      `
    });

    // 5. Inserir configurações padrão
    console.log('⚙️  Inserindo configurações padrão...');
    const defaultSettings = {
      id: 'default_settings',
      settings_data: {
        store: {
          name: 'JáPede',
          description: 'Sistema de pedidos online',
          logo_url: null,
          theme: {
            primary_color: '#F97316',
            secondary_color: '#2196F3',
            accent_color: '#4CAF50'
          }
        },
        payments: {
          enabled_methods: ['credit_card', 'pix'],
          pix_key: null,
          pix_key_type: null
        },
        whatsapp: {
          notify_order_confirmation: true,
          notify_order_ready: false,
          notify_order_out_for_delivery: false,
          phone_number_id: null,
          phone_display_number: null
        },
        notifications: {
          sound_alert_new_order_admin: true,
          email_admin_new_order: null
        }
      },
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('app_settings')
      .upsert(defaultSettings);

    if (insertError) {
      console.log('⚠️  Erro ao inserir configurações padrão:', insertError.message);
    } else {
      console.log('✅ Configurações padrão inseridas com sucesso');
    }

    console.log('🎉 Configuração do banco de dados concluída com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   1. Configure as variáveis de ambiente no .env');
    console.log('   2. Execute: npm run dev');
    console.log('   3. Acesse: http://localhost:3001');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
    process.exit(1);
  }
}

// Executar configuração
setupDatabase(); 