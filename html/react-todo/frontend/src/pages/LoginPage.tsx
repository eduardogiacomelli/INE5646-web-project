import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react'; // <--- CORRIGIDO
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface LoginResponse {
  _id: string;
  username: string;
  email: string;
  token: string;
  message?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      loginUser(response.data.token, {
        _id: response.data._id,
        username: response.data.username,
        email: response.data.email,
      });

      navigate('/dashboard');

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao fazer login. Tente novamente.';
      setError(errorMessage);
      console.error("Erro de login na página:", err);
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
          <h1>Login</h1>
	  <hr />
          <h2>Conecte-se à sua conta para gerenciar as suas tarefas.</h2>
        </hgroup>
        <form onSubmit={handleSubmit}>
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
              aria-invalid={error ? 'true' : undefined}
            />
          </label>

          <label htmlFor="password">
            Senha
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={error ? 'true' : undefined}
            />
          </label>

          {error && (
            <p style={{ color: 'var(--pico-form-element-invalid-active-border-color, red)' }}>
              {error}
            </p>
          )}

          <button type="submit" aria-busy={isLoading} disabled={isLoading}>
            {isLoading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
        <footer style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p>
            Não tem uma conta? <Link to="/register">Crie uma aqui</Link>!
          </p>
        </footer>
      </article>
    </div>
  );
};

export default LoginPage;

