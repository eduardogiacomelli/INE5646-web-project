const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors'); // Para logs coloridos no console
const cors = require('cors');
const path = require('path'); // Módulo 'path' do Node.js

// Importar arquivos de rota
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const memberRoutes = require('./routes/memberRoutes');

// Importar conexão com o banco de dados
const connectDB = require('./config/db');

// Importar middleware de tratamento de erros (criaremos a seguir)
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Carregar variáveis de ambiente do arquivo .env localizado na pasta 'backend'
// É importante que o .env esteja na raiz da pasta 'backend' para este path funcionar
dotenv.config({ path: path.join(__dirname, '../.env') });


// Conectar ao MongoDB
connectDB();

const app = express();

// Configuração do CORS
// Para desenvolvimento, você pode permitir todas as origens.
// Para produção, restrinja às origens do seu frontend.
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL // Para produção, usará o FRONTEND_URL do seu .env
    : ['http://localhost:5173', 'http://150.162.244.21:8080'], // <--- ALTERADO AQUI
  // Ou, se quiser ser mais permissivo apenas em desenvolvimento:
  // origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', // Permite todas as origens em desenvolvimento (cuidado)
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));




// Middleware para parsear o corpo das requisições JSON
app.use(express.json());
// Middleware para parsear corpos de requisição URL-encoded
app.use(express.urlencoded({ extended: true }));


// Middleware de log de requisições (simples, apenas para desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan'); // HTTP request logger middleware
  app.use(morgan('dev'));
}

// Montar as rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/members', memberRoutes);


// Rota de teste para verificar se a API está online
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'API do App de Tarefas está operacional!' });
});


// Middlewares de tratamento de erros (devem ser os últimos a serem usados)
// Middleware para rotas não encontradas (404)
app.use(notFound);
// Middleware genérico para tratamento de erros
app.use(errorHandler);


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(
    `Servidor rodando em modo ${process.env.NODE_ENV} na porta ${PORT}`.yellow.bold
  );
});

