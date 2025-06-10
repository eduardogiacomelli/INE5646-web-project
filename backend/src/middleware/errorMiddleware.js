
/**
 * Middleware para tratar rotas não encontradas (404).
 * Cria um erro e passa para o próximo manipulador de erros.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Não encontrado - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passa o erro para o próximo middleware de erro
};

/**
 * Middleware genérico para tratamento de erros.
 * Captura qualquer erro que ocorra na aplicação e envia uma resposta JSON formatada.
 * Define o status code da resposta. Se o res.statusCode for 200 (OK),
 * ele o altera para 500 (Internal Server Error), caso contrário, usa o statusCode já definido.
 */
const errorHandler = (err, req, res, next) => {
  // Às vezes, um erro pode vir com um status code OK, o que não faz sentido.
  // Se o statusCode for 200, mudamos para 500, senão usamos o que já está definido.
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Tratamento específico para erros do Mongoose (como ObjectId inválido)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404; // Ou 400, dependendo de como você quer tratar
    message = 'Recurso não encontrado (ID mal formatado).';
  }

  // Tratamento específico para erros de validação do Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Coleta todas as mensagens de erro de validação
    const messages = Object.values(err.errors).map(val => val.message);
    message = `Erro de validação: ${messages.join(', ')}`;
  }

  // Tratamento para erros de chave duplicada do MongoDB (código 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Valor duplicado para o campo '${field}'. Por favor, use outro valor.`;
  }


  res.status(statusCode).json({
    message: message,
    // A stack trace só deve ser enviada em ambiente de desenvolvimento
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };

