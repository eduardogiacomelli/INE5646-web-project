const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // A string de conexão MONGODB_URI será lida do arquivo .env
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Tempo limite para seleção do servidor (ms)
        socketTimeoutMS: 45000, // Tempo limite para operações de socket (ms)
	tls: true,
	tlsAllowInvalidCertificates: false
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Erro ao conectar com MongoDB: ${error.message}`.red.bold);
    // Sair do processo com falha para evitar que a aplicação rode sem DB
    process.exit(1);
  }
};

module.exports = connectDB;

