const mongoose = require("mongoose");
const Task = require("../models/Task");
const Member = require("../models/Member");

/**
 * @desc    Criar uma nova tarefa
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res) => {
  // Define um valor padrão '[]' se o frontend não enviar o campo.
  const {
    title,
    description,
    status,
    priority,
    assignedMemberIds = [],
    dueDate,
  } = req.body;
  const userId = req.user.id;

  try {
    // Valida se todos os membros enviados existem e pertencem ao usuário.
    if (assignedMemberIds && assignedMemberIds.length > 0) {
      const members = await Member.find({
        _id: { $in: assignedMemberIds },
        createdByUserId: userId,
      });
      if (members.length !== assignedMemberIds.length) {
        return res
          .status(404)
          .json({
            message:
              "Um ou mais membros atribuídos são inválidos ou não pertencem a você.",
          });
      }
    }

    const newTask = new Task({
      title,
      description,
      status,
      priority,
      userId,
      assignedMemberIds,
      dueDate,
    });
    const task = await newTask.save();

    // Popula a resposta com os dados dos membros para que o frontend possa exibi-los.
    const populatedTask = await Task.findById(task._id).populate(
      "assignedMemberIds",
      "name email"
    );
    res
      .status(201)
      .json({ task: populatedTask, message: "Tarefa criada com sucesso!" });
  } catch (error) {
    console.error("Erro ao criar tarefa:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(" ") });
    }
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao criar tarefa." });
  }
};

/**
 * @desc    Obter todas as tarefas do usuário logado (com filtros)
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getUserTasks = async (req, res) => {
  const userId = req.user.id;
  try {
    const tasks = await Task.find({ userId })
      .populate("assignedMemberIds", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      tasks,
      totalTasks: tasks.length,
    });
  } catch (error) {
    console.error("Erro ao buscar tarefas do usuário:", error.message);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao buscar tarefas." });
  }
};

/**
 * @desc    Obter uma tarefa específica pelo ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTaskById = async (req, res) => {
  const taskId = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID da tarefa inválido." });
    }
    const task = await Task.findOne({
      _id: taskId,
      userId: req.user.id,
    }).populate("assignedMemberIds", "name email role");
    if (!task) {
      return res.status(404).json({ message: "Tarefa não encontrada." });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error("Erro ao buscar tarefa por ID:", error.message);
    res.status(500).json({ message: "Erro interno do servidor." });
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
  const { title, description, status, priority, assignedMemberIds, dueDate } =
    req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID da tarefa inválido." });
    }
    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (status !== undefined) fieldsToUpdate.status = status;
    if (priority !== undefined) fieldsToUpdate.priority = priority;
    if (dueDate !== undefined)
      fieldsToUpdate.dueDate = dueDate === "" ? null : dueDate;

    if (assignedMemberIds !== undefined) {
      if (Array.isArray(assignedMemberIds) && assignedMemberIds.length > 0) {
        const members = await Member.find({
          _id: { $in: assignedMemberIds },
          createdByUserId: userId,
        });
        if (members.length !== assignedMemberIds.length) {
          return res
            .status(400)
            .json({ message: "Um ou mais membros atribuídos são inválidos." });
        }
      }
      fieldsToUpdate.assignedMemberIds = Array.isArray(assignedMemberIds)
        ? assignedMemberIds
        : [];
    }
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    ).populate("assignedMemberIds", "name email role");
    if (!updatedTask || updatedTask.userId.toString() !== userId) {
      return res
        .status(404)
        .json({
          message: "Tarefa não encontrada ou não pertence a este usuário.",
        });
    }
    res
      .status(200)
      .json({ task: updatedTask, message: "Tarefa atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(" ") });
    }
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao atualizar tarefa." });
  }
};

/**
 * @desc    Deletar uma tarefa
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID da tarefa inválido." });
    }
    const task = await Task.findOneAndDelete({
      _id: taskId,
      userId: req.user.id,
    });
    if (!task) {
      return res
        .status(404)
        .json({
          message: "Tarefa não encontrada ou não pertence a este usuário.",
        });
    }
    res.status(200).json({ message: "Tarefa deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error.message);
    res
      .status(500)
      .json({ message: "Erro interno do servidor ao deletar tarefa." });
  }
};
