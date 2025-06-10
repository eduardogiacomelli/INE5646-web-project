const express = require('express');
const router = express.Router();
const {
  createTask,
  getUserTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByStatus // Adicionado para a funcionalidade de monitoramento
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Todas as rotas abaixo são protegidas e requerem autenticação

// @route   POST /api/tasks
// @desc    Criar uma nova tarefa
// @access  Private
router.post('/', protect, createTask);

// @route   GET /api/tasks
// @desc    Obter todas as tarefas do usuário logado (com filtros, paginação, ordenação)
// @access  Private
router.get('/', protect, getUserTasks);

// @route   GET /api/tasks/status/:statusValue
// @desc    Obter tarefas do usuário por um status específico
// @access  Private
router.get('/status/:statusValue', protect, getTasksByStatus);

// @route   GET /api/tasks/:id
// @desc    Obter uma tarefa específica pelo ID
// @access  Private
router.get('/:id', protect, getTaskById);

// @route   PUT /api/tasks/:id
// @desc    Atualizar uma tarefa
// @access  Private
router.put('/:id', protect, updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Deletar uma tarefa
// @access  Private
router.delete('/:id', protect, deleteTask);

module.exports = router;

