import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react'; // <--- CORRIGIDO
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface RegisterResponse {
  _id: string;
  username: string;
  email: string;
  token: string;
  message?: string;
}

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<RegisterResponse>('/auth/register', {
        username,
        email,
        password,
      });

      setSuccessMessage(response.data.message || 'Registro bem-sucedido! A fazer login...');

      loginUser(response.data.token, {
        _id: response.data._id,
        username: response.data.username,
        email: response.data.email,
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao fazer registro. Tente novamente.';
      setError(errorMessage);
      console.error("Erro de registro na página:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
       <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
         <article aria-busy="true">A verificar autenticação...</article>
       </div>
     );
  }

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '3rem auto' }}>
      <article>
        <hgroup>
          <h1>Criar Conta</h1>
	  <hr />
          <h2>Cadastre-se para começar a gerenciar as suas tarefas.</h2>
        </hgroup>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">
            Nome de Usuário
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              aria-invalid={error?.includes('utilizador') ? 'true' : undefined}
            />
          </label>

          <label htmlFor="email">
            Email
            <input
              type="email"
              id="email"
              name="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={error?.includes('email') ? 'true' : undefined}
            />
          </label>

          <label htmlFor="password">
            Senha
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Crie uma senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              aria-invalid={error?.includes('senha') ? 'true' : undefined}
            />
          </label>

          <label htmlFor="confirmPassword">
            Confirmar Senha
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirme sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              aria-invalid={error?.includes('senhas não coincidem') ? 'true' : undefined}
            />
          </label>

          {error && (
            <p style={{ color: 'var(--pico-form-element-invalid-active-border-color, red)' }}>
              {error}
            </p>
          )}
          {successMessage && (
            <p style={{ color: 'var(--pico-form-element-valid-active-border-color, green)' }}>
              {successMessage}
            </p>
          )}

          <button type="submit" aria-busy={isLoading} disabled={isLoading}>
            {isLoading ? 'A registar...' : 'Registar'}
          </button>
        </form>
        <footer style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p>
            Já tem uma conta? <Link to="/login">Faça login aqui</Link>.
          </p>
        </footer>
      </article>
    </div>
  );
};

export default RegisterPage;

