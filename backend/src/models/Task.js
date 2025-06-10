const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'O título da tarefa é obrigatório.'],
    trim: true,
    maxlength: [100, 'O título não pode exceder 100 caracteres.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'A descrição não pode exceder 1000 caracteres.']
  },
  status: {
    type: String,
    enum: {
        values: ['pendente', 'em_andamento', 'concluida', 'arquivada'],
        message: 'Status inválido. Valores permitidos: pendente, em_andamento, concluida, arquivada.'
    },
    default: 'pendente'
  },
  priority: {
    type: String,
    enum: {
        values: ['baixa', 'media', 'alta'],
        message: 'Prioridade inválida. Valores permitidos: baixa, media, alta.'
    },
    default: 'media'
  },
  userId: { // Usuário que criou/possui a tarefa
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedToMemberId: { // Membro da equipe ao qual a tarefa está atribuída (opcional)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    default: null
  },
  dueDate: { // Data de vencimento da tarefa
    type: Date
  },
  // Você pode adicionar outros campos como 'tags', 'attachments', etc.
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Index para otimizar buscas por usuário e status
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });


module.exports = mongoose.model('Task', TaskSchema);
