const jwt = require('jsonwebtoken');
const User = require('../models/User');
// O process.env.JWT_SECRET será acessado diretamente, pois o dotenv já foi configurado no server.js

/**
 * Middleware para proteger rotas.
 * Verifica o token JWT no header Authorization.
 * Se o token for válido, adiciona o objeto do usuário (sem a senha) à requisição (req.user).
 */
const protect = async (req, res, next) => {
  let token;

  // Verifica se o header de autorização existe e começa com 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extrai o token do header (formato: "Bearer TOKEN_AQUI")
      token = req.headers.authorization.split(' ')[1];

      // Verifica e decodifica o token usando o segredo JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Busca o usuário no banco de dados pelo ID contido no token.
      // Exclui o campo 'password' da seleção.
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // Caso o usuário associado ao token não exista mais (ex: foi deletado)
        return res.status(401).json({ message: 'Não autorizado, usuário do token não encontrado.' });
      }

      // Prossegue para o próximo middleware ou para o controlador da rota
      next();
    } catch (error) {
      console.error('Erro na autenticação do token:', error.message);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Não autorizado, token inválido.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Não autorizado, token expirado.' });
      }
      return res.status(401).json({ message: 'Não autorizado, falha na verificação do token.' });
    }
  }

  // Se não houver token no header
  if (!token) {
    return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
  }
};


module.exports = { protect }; // Exportando como um objeto para facilitar a adição de outros middlewares no futuro

