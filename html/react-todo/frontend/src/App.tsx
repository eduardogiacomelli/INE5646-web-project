import React from 'react';
import { Routes, Route, Link, Navigate, Outlet } from 'react-router-dom';

// Importar Páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UserTasksPage from './pages/UserTasksPage';
import UserMembersPage from './pages/UserMembersPage';
import TaskMonitoringPage from './pages/TaskMonitoringPage';

// Importar Componentes Comuns
import Navbar from './components/common/Navbar';

// Importar Contexto e Hook de Autenticação
import { useAuth } from './contexts/AuthContext';

// Componente para rotas que devem ser acessíveis APENAS por utilizadores NÃO autenticados
// Ex: Páginas de Login e Registro não devem ser acessíveis se o utilizador já estiver logado.
const PublicOnlyRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <article aria-busy="true">A verificar autenticação...</article>
      </div>
    );
  }
  // Se autenticado, redireciona para o dashboard em vez de mostrar a página pública (login/registro)
  return !isAuthenticated ? (children || <Outlet />) : <Navigate to="/dashboard" replace />;
};


// Componente para rotas protegidas (requer autenticação)
const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <article aria-busy="true">A verificar autenticação para esta página...</article>
      </div>
    );
  }

  return isAuthenticated ? (children || <Outlet />) : <Navigate to="/login" replace />;
};

// Componente para a rota raiz que decide entre HomePage e DashboardPage
const RootPageDecider: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <article aria-busy="true">A carregar...</article>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />;
};


function App() {
  return (
    <>
      <Navbar />
      <main className="container" id="main-content">
        <Routes>
          {/* Rota Raiz: Decide entre HomePage ou Dashboard (redireciona para /dashboard se logado) */}
          <Route path="/" element={<RootPageDecider />} />

          {/* Rotas Públicas (apenas para não autenticados) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Rotas Privadas (Protegidas) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/minhas-tarefas" element={<UserTasksPage />} />
            <Route path="/meus-membros" element={<UserMembersPage />} />
            <Route path="/monitoramento-tarefas" element={<TaskMonitoringPage />} />
            {/* Adicionar outras rotas protegidas aqui, como /perfil, /configuracoes, etc. */}
          </Route>
          
          {/* Rota para qualquer outro caminho não definido (Página 404) */}
          <Route path="*" element={
            <article style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem' }}>
              <hgroup>
                <h1>Página Não Encontrada (404)</h1>
                <h2>Oops! Parece que se perdeu.</h2>
              </hgroup>
              <p>Lamentamos, mas a página que procura não existe ou foi movida.</p>
              <p>Verifique o URL ou regresse à página inicial.</p>
              <Link to="/" role="button" className="contrast" style={{ marginTop: '1rem' }}>
                Voltar para a Página Inicial
              </Link>
            </article>
          } />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: '2rem 1rem', marginTop: 'auto', borderTop: '1px solid var(--pico-muted-border-color, #e5e7eb)' }}>
        <div className="container">
          <p>
            © {new Date().getFullYear()} INE5646 - Gerenciador de Tarefas. Todos os direitos reservados.
          </p>
          <p>
            Desenvolvido por Eduardo Wallner Giacomelli & Matias Adrian Fuks.
          </p>
          <p>
            <a href="#main-content" onClick={(e) => {
              e.preventDefault();
              const mainContent = document.getElementById('main-content');
              if (mainContent) {
                mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}>
              Voltar ao Topo ↑
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;

