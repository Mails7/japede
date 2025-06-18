import { Pool } from 'pg';
import { config } from 'dotenv';

// Carrega as variáveis de ambiente
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    // Inicia uma transação
    await client.query('BEGIN');

    // Remove todas as tabelas existentes
    await client.query(`
      DROP TABLE IF EXISTS migrations CASCADE;
      DROP TABLE IF EXISTS app_settings CASCADE;
      DROP TABLE IF EXISTS profiles CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);

    // Commit da transação
    await client.query('COMMIT');
    
    console.log('Banco de dados resetado com sucesso!');
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro ao resetar o banco de dados:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase(); 