const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Importando o middleware 'protect'

// @route   POST /api/auth/register
// @desc    Registrar um novo usuário
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Autenticar usuário e obter token
// @access  Public
router.post('/login', loginUser);

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private (requer token)
router.get('/me', protect, getMe); // A rota /me agora está protegida

// Futuramente, você pode adicionar mais rotas de autenticação aqui, como:
// router.put('/updatedetails', protect, updateUserDetails);
// router.put('/updatepassword', protect, updateUserPassword);
// router.post('/forgotpassword', forgotPassword);
// router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;

