const mongoose = require('mongoose'); // <--- ADICIONADO ESTA LINHA
const Task = require('../models/Task');
const Member = require('../models/Member'); // Para validar se o membro atribuído pertence ao usuário

/**
 * @desc    Criar uma nova tarefa
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res) => {
  const { title, description, status, priority, assignedToMemberId, dueDate } = req.body;
  const userId = req.user.id; // Obtido do middleware de autenticação

  try {
    // Validação: Verificar se o membro atribuído (se houver) pertence ao usuário logado
    if (assignedToMemberId) {
      // Verificar se assignedToMemberId é um ObjectId válido antes de consultar
      if (!mongoose.Types.ObjectId.isValid(assignedToMemberId)) {
        return res.status(400).json({ message: 'ID do membro atribuído inválido.' });
      }
      const member = await Member.findOne({ _id: assignedToMemberId, createdByUserId: userId });
      if (!member) {
        return res.status(404).json({ message: 'Membro atribuído não encontrado ou não pertence a você.' });
      }
    }

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      userId,
      assignedToMemberId: assignedToMemberId || null,
      dueDate
    });

    const task = await newTask.save();
    res.status(201).json({ task, message: 'Tarefa criada com sucesso!' });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error.message);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar tarefa.' });
  }
};

/**
 * @desc    Obter todas as tarefas do usuário logado
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getUserTasks = async (req, res) => {
  const userId = req.user.id;
  const { status, priority, sortBy, sortOrder = 'asc', page = 1, limit = 100, memberId, search } = req.query; // Aumentado o limite padrão

  try {
    const queryOptions = { userId };

    if (status) queryOptions.status = status;
    if (priority) queryOptions.priority = priority;
    
    if (memberId) {
        if (memberId === 'null' || memberId === 'undefined') {
            queryOptions.assignedToMemberId = null;
        } else if (mongoose.Types.ObjectId.isValid(memberId)) {
            queryOptions.assignedToMemberId = memberId;
        } else {
            // Se memberId não for 'null' nem um ObjectId válido, podemos ignorar ou retornar erro
            // Por agora, vamos assumir que se não for válido, não filtra por membro
        }
    }


    if (search) {
        queryOptions.title = { $regex: search, $options: 'i' }; // Busca case-insensitive no título
    }

    const sortParams = {};
    if (sortBy) {
        sortParams[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sortParams.createdAt = -1; // Padrão: mais recentes primeiro
    }
    
    const tasksCount = await Task.countDocuments(queryOptions);
    const tasks = await Task.find(queryOptions)
      .populate('assignedToMemberId', 'name email role') 
      .sort(sortParams)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      tasks,
      currentPage: parseInt(page),
      totalPages: Math.ceil(tasksCount / parseInt(limit)),
      totalTasks: tasksCount
    });

  } catch (error) {
    console.error('Erro ao buscar tarefas do usuário:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar tarefas.' });
  }
};

/**
 * @desc    Obter uma tarefa específica pelo ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTaskById = async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) { // Verifica se o ID é um ObjectId válido
        return res.status(400).json({ message: 'ID da tarefa inválido.' });
    }

    const task = await Task.findOne({ _id: taskId, userId })
                           .populate('assignedToMemberId', 'name email role');

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário.' });
    }
    res.status(200).json(task);

  } catch (error) {
    console.error('Erro ao buscar tarefa por ID:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar tarefa.' });
  }
};

/**
 * @desc    Atualizar uma tarefa
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  // Pegar apenas os campos permitidos para atualização do corpo da requisição
  const { title, description, status, priority, assignedToMemberId, dueDate } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) { // Verifica o ID da tarefa
        return res.status(400).json({ message: 'ID da tarefa inválido.' });
    }

    let task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário para atualização.' });
    }

    // Criar um objeto com os campos que foram fornecidos para atualização
    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (status !== undefined) fieldsToUpdate.status = status;
    if (priority !== undefined) fieldsToUpdate.priority = priority;
    if (dueDate !== undefined) fieldsToUpdate.dueDate = dueDate === '' ? null : dueDate; // Permite limpar a data

    if (assignedToMemberId !== undefined) {
      if (assignedToMemberId === null || assignedToMemberId === '') {
        fieldsToUpdate.assignedToMemberId = null;
      } else if (mongoose.Types.ObjectId.isValid(assignedToMemberId)) {
        // Verificar se o membro atribuído pertence ao usuário logado
        const member = await Member.findOne({ _id: assignedToMemberId, createdByUserId: userId });
        if (!member) {
          return res.status(400).json({ message: 'Membro atribuído não encontrado ou não pertence a você.' });
        }
        fieldsToUpdate.assignedToMemberId = assignedToMemberId;
      } else {
        return res.status(400).json({ message: 'ID do membro atribuído inválido.' });
      }
    }
    
    // Atualizar a tarefa com os novos campos
    // Usar findByIdAndUpdate para atomically update e retornar o documento atualizado.
    // O new: true garante que o documento retornado seja o atualizado.
    // O runValidators: true garante que as validações do schema sejam aplicadas na atualização.
    const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: fieldsToUpdate }, { new: true, runValidators: true })
                                  .populate('assignedToMemberId', 'name email role');

    if (!updatedTask) { // Caso o findOne tenha encontrado, mas o update falhou por algum motivo raro
        return res.status(404).json({ message: 'Não foi possível encontrar a tarefa para atualizar após a tentativa.' });
    }
    
    res.status(200).json({ task: updatedTask, message: 'Tarefa atualizada com sucesso!' });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error.message);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
    }
    // Adicionar tratamento para CastError se um ObjectId inválido for passado de alguma forma
    if (error.name === 'CastError') {
        return res.status(400).json({ message: `Formato de ID inválido para o campo ${error.path}.` });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar tarefa.', details: error.message });
  }
};

/**
 * @desc    Deletar uma tarefa
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) { // Verifica o ID
        return res.status(400).json({ message: 'ID da tarefa inválido.' });
    }

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário para exclusão.' });
    }

    // await task.deleteOne(); // Correção: usar o método estático do modelo
    await Task.findByIdAndDelete(taskId);
    
    res.status(200).json({ message: 'Tarefa deletada com sucesso.' });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao deletar tarefa.' });
  }
};


/**
 * @desc    Obter tarefas por status (para monitoramento)
 * @route   GET /api/tasks/status/:statusValue
 * @access  Private
 */
exports.getTasksByStatus = async (req, res) => {
  const userId = req.user.id;
  const { statusValue } = req.params;
  const validStatuses = ['pendente', 'em_andamento', 'concluida', 'arquivada'];

  if (!validStatuses.includes(statusValue)) {
    return res.status(400).json({ message: 'Status inválido fornecido.' });
  }

  try {
    const tasks = await Task.find({ userId, status: statusValue })
      .populate('assignedToMemberId', 'name email role')
      .sort({ dueDate: 1, priority: -1 }); // Exemplo de ordenação

    res.status(200).json(tasks);
  } catch (error) {
    console.error(`Erro ao buscar tarefas por status (${statusValue}):`, error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar tarefas por status.' });
  }
};

