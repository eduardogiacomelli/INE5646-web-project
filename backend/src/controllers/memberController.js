const Member = require('../models/Member');
const Task = require('../models/Task'); // Para lidar com tarefas atribuídas ao deletar membro
const mongoose = require('mongoose'); // Para checar ObjectId válido

/**
 * @desc    Criar um novo membro da equipe
 * @route   POST /api/members
 * @access  Private
 */
exports.createMember = async (req, res) => {
  const { name, email, role } = req.body;
  const createdByUserId = req.user.id; // Obtido do middleware de autenticação

  try {
    // Opcional: Verificar se já existe um membro com este email para este usuário
    if (email) {
        const existingMemberByEmail = await Member.findOne({ email, createdByUserId });
        if (existingMemberByEmail) {
            return res.status(400).json({ message: 'Você já possui um membro com este email.' });
        }
    }

    const newMember = new Member({
      name,
      email,
      role,
      createdByUserId
    });

    const member = await newMember.save();
    res.status(201).json({ member, message: 'Membro criado com sucesso!' });

  } catch (error) {
    console.error('Erro ao criar membro:', error.message);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao criar membro.' });
  }
};

/**
 * @desc    Obter todos os membros da equipe do usuário logado
 * @route   GET /api/members
 * @access  Private
 */
exports.getUserMembers = async (req, res) => {
  const createdByUserId = req.user.id;
  const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = req.query;

  try {
    const queryOptions = { createdByUserId };
    if (search) {
        queryOptions.$or = [ // Busca por nome ou email
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const sortParams = {};
    if (sortBy) {
        sortParams[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }


    const members = await Member.find(queryOptions)
        .sort(sortParams)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const totalMembers = await Member.countDocuments(queryOptions);

    res.status(200).json({
        members,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMembers / limit),
        totalMembers
    });

  } catch (error) {
    console.error('Erro ao buscar membros do usuário:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar membros.' });
  }
};

/**
 * @desc    Obter um membro específico pelo ID
 * @route   GET /api/members/:id
 * @access  Private
 */
exports.getMemberById = async (req, res) => {
  const memberId = req.params.id;
  const createdByUserId = req.user.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: 'ID do membro inválido.' });
    }

    const member = await Member.findOne({ _id: memberId, createdByUserId });
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado ou não pertence a você.' });
    }
    res.status(200).json(member);

  } catch (error) {
    console.error('Erro ao buscar membro por ID:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar membro.' });
  }
};

/**
 * @desc    Atualizar um membro da equipe
 * @route   PUT /api/members/:id
 * @access  Private
 */
exports.updateMember = async (req, res) => {
  const memberId = req.params.id;
  const createdByUserId = req.user.id;
  const { name, email, role } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: 'ID do membro inválido.' });
    }

    let member = await Member.findOne({ _id: memberId, createdByUserId });
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado ou não pertence a você.' });
    }

    // Opcional: Se o email for alterado, verificar se o novo email já está em uso por outro membro deste usuário
    if (email && email !== member.email) {
        const existingMemberByEmail = await Member.findOne({ email, createdByUserId, _id: { $ne: memberId } });
        if (existingMemberByEmail) {
            return res.status(400).json({ message: 'Outro membro seu já utiliza este email.' });
        }
        member.email = email;
    }

    // Atualizar campos
    if (name) member.name = name;
    if (role !== undefined) member.role = role; // Permite string vazia para limpar o cargo

    const updatedMember = await member.save();
    res.status(200).json({ member: updatedMember, message: 'Membro atualizado com sucesso!' });

  } catch (error) {
    console.error('Erro ao atualizar membro:', error.message);
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
    }
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar membro.' });
  }
};

/**
 * @desc    Deletar um membro da equipe
 * @route   DELETE /api/members/:id
 * @access  Private
 */
exports.deleteMember = async (req, res) => {
  const memberId = req.params.id;
  const createdByUserId = req.user.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
        return res.status(400).json({ message: 'ID do membro inválido.' });
    }

    const member = await Member.findOne({ _id: memberId, createdByUserId });
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado ou não pertence a você.' });
    }

    // Antes de deletar o membro, decidir o que fazer com as tarefas atribuídas a ele.
    // Opção 1: Desatribuir as tarefas (setar assignedToMemberId para null)
    await Task.updateMany(
      { userId: createdByUserId, assignedToMemberId: memberId },
      { $set: { assignedToMemberId: null } }
    );
    // Opção 2: Deletar as tarefas atribuídas (CUIDADO: pode ser destrutivo)
    // await Task.deleteMany({ userId: createdByUserId, assignedToMemberId: memberId });

    await member.deleteOne();
    res.status(200).json({ message: 'Membro deletado com sucesso e tarefas foram desatribuídas.' });

  } catch (error) {
    console.error('Erro ao deletar membro:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor ao deletar membro.' });
  }
};

