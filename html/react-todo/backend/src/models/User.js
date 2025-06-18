const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'O nome de usuário é obrigatório.'],
    unique: true,
    trim: true,
    minlength: [3, 'O nome de usuário deve ter pelo menos 3 caracteres.']
  },
  email: {
    type: String,
    required: [true, 'O email é obrigatório.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Por favor, insira um email válido.']
  },
  password: {
    type: String,
    required: [true, 'A senha é obrigatória.'],
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres.']
    // Não selecionamos a senha por padrão ao buscar usuários
    // select: false 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Middleware para hashear a senha antes de salvar
UserSchema.pre('save', async function(next) {
  // Roda esta função apenas se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) {
    return next();
  }
  // Gera o salt e hashea a senha
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar senhas (instância do modelo)
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
