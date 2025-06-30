const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Função auxiliar para gerar o token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * @desc    Registrar um novo usuário
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validação básica de entrada (o Mongoose também fará validação no nível do schema)
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Por favor, forneça nome de usuário, email e senha.",
      });
    }

    // Verificar se o usuário já existe pelo email
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "Já existe um usuário com este email." });
    }

    // Verificar se o usuário já existe pelo username
    user = await User.findOne({ username });
    if (user) {
      return res
        .status(400)
        .json({ message: "Este nome de usuário já está em uso." });
    }

    // Criar novo usuário (a senha será hasheada pelo middleware 'pre save' no modelo User)
    user = new User({
      username,
      email,
      password,
    });

    await user.save();

    // Gerar token e responder
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token,
      message: "Usuário registrado com sucesso!",
    });
  } catch (error) {
    console.error("Erro no registro do usuário:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(" ") });
    }
    res.status(500).json({
      message: "Erro interno do servidor ao tentar registrar o usuário.",
    });
  }
};

/**
 * @desc    Autenticar um usuário (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Por favor, forneça email e senha." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas (email não encontrado)." });
    }

    // Comparar a senha fornecida com a senha hasheada no banco
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas (senha incorreta)." });
    }

    // Gerar token e responder
    const token = generateToken(user._id);
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token,
      message: "Login bem-sucedido!",
    });
  } catch (error) {
    console.error("Erro no login:", error.message);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao tentar fazer login." });
  }
};

/**
 * @desc    Obter dados do usuário logado
 * @route   GET /api/auth/me
 * @access  Private (requer token)
 */
exports.getMe = async (req, res) => {
  try {
    // req.user é populado pelo middleware de autenticação (authMiddleware)
    // Buscamos o usuário novamente para garantir os dados mais recentes, excluindo a senha
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      // Isso não deveria acontecer se o token for válido e o middleware funcionar, mas é uma boa checagem.
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar dados do usuário (getMe):", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao buscar dados do usuário.",
    });
  }
};

// Futuramente, vamos adicionar controllers para:
// - Atualizar perfil do usuário
// - Mudar senha
// - Solicitar redefinição de senha, etc.
