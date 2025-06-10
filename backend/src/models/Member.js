const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome do membro é obrigatório.'],
    trim: true,
    maxlength: [100, 'O nome não pode exceder 100 caracteres.']
  },
  email: { // Email do membro, pode ser útil para contato ou futuras integrações
    type: String,
    trim: true,
    lowercase: true,
    // unique: true, // Pode ser único por usuário criador, não globalmente
    match: [/.+\@.+\..+/, 'Por favor, insira um email válido para o membro.'],
    sparse: true // Permite múltiplos documentos com valor null/ausente para email
  },
  role: { // Ex: 'Desenvolvedor', 'Designer', etc.
    type: String,
    trim: true,
    maxlength: [50, 'O cargo não pode exceder 50 caracteres.']
  },
  // Outros campos relevantes para um membro da equipe, como telefone, etc.
  createdByUserId: { // Usuário que adicionou este membro à sua "equipe"
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Index para otimizar buscas por usuário criador
MemberSchema.index({ createdByUserId: 1, name: 1 });
// Para garantir que um usuário não adicione membros com o mesmo email (se email for obrigatório e único por usuário)
// MemberSchema.index({ createdByUserId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });


module.exports = mongoose.model('Member', MemberSchema);
