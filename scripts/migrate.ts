import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Carrega as variáveis de ambiente
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Cria a tabela de migrações se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Lê o diretório de migrações
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Executa cada migração
    for (const file of files) {
      const migrationName = path.basename(file, '.sql');
      
      // Verifica se a migração já foi executada
      const { rows } = await client.query(
        'SELECT id FROM migrations WHERE name = $1',
        [migrationName]
      );

      if (rows.length === 0) {
        console.log(`Executando migração: ${migrationName}`);
        
        // Lê e executa o arquivo SQL
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migrationName]
          );
          await client.query('COMMIT');
          console.log(`Migração ${migrationName} executada com sucesso`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
      } else {
        console.log(`Migração ${migrationName} já foi executada`);
      }
    }
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations(); 