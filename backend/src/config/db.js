const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // A string de conexão MONGODB_URI será lida do arquivo .env
    // As opções useNewUrlParser e useUnifiedTopology não são mais necessárias
    // a partir do Mongoose 6. O Mongoose as define como true por padrão.
    // No entanto, outras opções como 'serverSelectionTimeoutMS' podem ser úteis.
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
        // useNewUrlParser: true, // Não é mais necessário no Mongoose 6+
        // useUnifiedTopology: true, // Não é mais necessário no Mongoose 6+
        // useCreateIndex: true, // Não é mais suportado, os índices são criados por padrão com ensureIndexes
        // useFindAndModify: false, // Não é mais suportado
        serverSelectionTimeoutMS: 5000, // Tempo limite para seleção do servidor (ms)
        socketTimeoutMS: 45000, // Tempo limite para operações de socket (ms)
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Erro ao conectar com MongoDB: ${error.message}`.red.bold);
    // Sair do processo com falha para evitar que a aplicação rode sem DB
    process.exit(1);
  }
};

module.exports = connectDB;

