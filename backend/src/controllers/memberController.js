const Member = require("../models/Member");
const Task = require("../models/Task");
const mongoose = require("mongoose");

/**
 * @desc    Criar um novo membro da equipe
 * @route   POST /api/members
 * @access  Private
 */
exports.createMember = async (req, res) => {
  const { name, email, role } = req.body;
  const createdByUserId = req.user.id;
  try {
    if (!name || name.trim().length < 3) {
      return res
        .status(400)
        .json({
          message:
            "O nome do membro é obrigatório e deve ter pelo menos 3 caracteres.",
        });
    }
    if (email && email.trim() !== "") {
      const existingMemberByEmail = await Member.findOne({
        email: email.trim(),
        createdByUserId,
      });
      if (existingMemberByEmail) {
        return res
          .status(400)
          .json({ message: "Você já possui um membro com este email." });
      }
    }
    const newMember = new Member({
      name: name.trim(),
      email: email ? email.trim() : "",
      role: role ? role.trim() : "",
      createdByUserId,
    });
    const member = await newMember.save();
    const memberWithTaskCount = { ...member.toObject(), completedTasks: 0 };
    res
      .status(201)
      .json({
        member: memberWithTaskCount,
        message: "Membro criado com sucesso!",
      });
  } catch (error) {
    console.error("Erro ao criar membro:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((val) => val.message)
          .join(" "),
      });
    }
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao criar membro." });
  }
};

/**
 * @desc    Obter todos os membros da equipe do usuário, com contagem de tarefas concluídas
 * @route   GET /api/members
 * @access  Private
 */
exports.getUserMembers = async (req, res) => {
  try {
    const membersWithTaskCount = await Member.aggregate([
      { $match: { createdByUserId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "assignedMemberIds",
          as: "assignedTasks",
        },
      },
      {
        $addFields: {
          completedTasks: {
            $size: {
              $filter: {
                input: "$assignedTasks",
                as: "task",
                cond: { $eq: ["$$task.status", "concluida"] },
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          completedTasks: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);
    res
      .status(200)
      .json({
        members: membersWithTaskCount,
        totalMembers: membersWithTaskCount.length,
      });
  } catch (error) {
    console.error("Erro ao buscar membros:", error.message);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao buscar membros." });
  }
};

/**
 * @desc    Obter um membro específico pelo ID
 * @route   GET /api/members/:id
 * @access  Private
 */
exports.getMemberById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de membro inválido." });
    }
    const member = await Member.findOne({
      _id: req.params.id,
      createdByUserId: req.user.id,
    });
    if (!member) {
      return res.status(404).json({ message: "Membro não encontrado." });
    }
    res.status(200).json(member);
  } catch (error) {
    console.error("Erro ao buscar membro por ID:", error.message);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @desc    Atualizar um membro da equipe
 * @route   PUT /api/members/:id
 * @access  Private
 */
exports.updateMember = async (req, res) => {
  const { name, email, role } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de membro inválido." });
    }
    if (name !== undefined && (!name || name.trim().length < 3)) {
      return res
        .status(400)
        .json({
          message: "O nome do membro deve ter pelo menos 3 caracteres.",
        });
    }
    const member = await Member.findOne({
      _id: req.params.id,
      createdByUserId: req.user.id,
    });
    if (!member) {
      return res.status(404).json({ message: "Membro não encontrado." });
    }
    if (email && email.trim() !== "" && email !== member.email) {
      const existingMemberByEmail = await Member.findOne({
        email: email.trim(),
        createdByUserId: req.user.id,
        _id: { $ne: req.params.id },
      });
      if (existingMemberByEmail) {
        return res
          .status(400)
          .json({ message: "Outro membro seu já utiliza este email." });
      }
    }
    member.name = name?.trim() ?? member.name;
    member.email = email?.trim() ?? member.email;
    member.role = role?.trim() ?? member.role;
    const updatedMember = await member.save();
    res
      .status(200)
      .json({
        member: updatedMember,
        message: "Membro atualizado com sucesso!",
      });
  } catch (error) {
    console.error("Erro ao atualizar membro:", error.message);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};

/**
 * @desc    Deletar um membro da equipe
 * @route   DELETE /api/members/:id
 * @access  Private
 */
exports.deleteMember = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de membro inválido." });
    }
    const member = await Member.findOne({
      _id: req.params.id,
      createdByUserId: req.user.id,
    });
    if (!member) {
      return res.status(404).json({ message: "Membro não encontrado." });
    }
    await Task.updateMany(
      { userId: req.user.id },
      { $pull: { assignedMemberIds: req.params.id } }
    );
    await Member.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Membro deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar membro:", error.message);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
};
