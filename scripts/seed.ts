import { Pool } from 'pg';
import { config } from 'dotenv';
import { supabase } from './supabaseClient';

// Carrega as variáveis de ambiente
config();

async function seedDatabase() {
  try {
    // Configurações padrão do aplicativo
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

    // Insere as configurações padrão
    const { error: settingsError } = await supabase
      .from('app_settings')
      .upsert(defaultSettings);

    if (settingsError) {
      console.error('Erro ao inserir configurações padrão:', settingsError);
      throw settingsError;
    }

    console.log('Dados iniciais inseridos com sucesso!');
  } catch (error) {
    console.error('Erro ao popular o banco de dados:', error);
    process.exit(1);
  }
}

seedDatabase(); 