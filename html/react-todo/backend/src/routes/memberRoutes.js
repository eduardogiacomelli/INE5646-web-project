const express = require('express');
const router = express.Router();
const {
  createMember,
  getUserMembers,
  getMemberById,
  updateMember,
  deleteMember
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');

// Todas as rotas abaixo são protegidas e requerem autenticação

// @route   POST /api/members
// @desc    Criar um novo membro da equipe
// @access  Private
router.post('/', protect, createMember);

// @route   GET /api/members
// @desc    Obter todos os membros da equipe do usuário logado (com filtros, paginação, ordenação)
// @access  Private
router.get('/', protect, getUserMembers);

// @route   GET /api/members/:id
// @desc    Obter um membro específico pelo ID
// @access  Private
router.get('/:id', protect, getMemberById);

// @route   PUT /api/members/:id
// @desc    Atualizar um membro da equipe
// @access  Private
router.put('/:id', protect, updateMember);

// @route   DELETE /api/members/:id
// @desc    Deletar um membro da equipe
// @access  Private
router.delete('/:id', protect, deleteMember);

module.exports = router;

