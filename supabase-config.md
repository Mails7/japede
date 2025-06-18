# Configuração do Supabase - JáPede

## 🔑 Credenciais do Projeto

### URL do Projeto
```
https://ssuqohpsjqzcaibprrtw.supabase.co
```

### Chave Anônima (Anon Key)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzdXFvaHBzanF6Y2FpYnBycnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjE0NzAsImV4cCI6MjA2NTY5NzQ3MH0.JFf1aTLmHXJrrcNkn7I8L9LWsD9IFyOxD5dv2K9FF-o
```

## 📋 Configuração do .env

Crie um arquivo `.env` na raiz do projeto com:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ssuqohpsjqzcaibprrtw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzdXFvaHBzanF6Y2FpYnBycnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjE0NzAsImV4cCI6MjA2NTY5NzQ3MH0.JFf1aTLmHXJrrcNkn7I8L9LWsD9IFyOxD5dv2K9FF-o

# API Keys
VITE_GEMINI_API_KEY=sua_chave_do_gemini_aqui

# Application Settings
VITE_APP_NAME=JáPede
VITE_APP_DESCRIPTION=Sistema de pedidos online
```

## 🗄️ Próximos Passos

1. **Execute o script SQL** no Supabase SQL Editor
2. **Configure as políticas RLS**
3. **Teste a conexão** com o sistema 