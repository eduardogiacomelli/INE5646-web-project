// frontend/src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Para aceder aos dados do utilizador, se necessário

const DashboardPage: React.FC = () => {
  const { user } = useAuth(); // Obter os dados do utilizador logado

  return (
    <article>
      <hgroup>
        <h1>Bem-vindo ao seu Dashboard, {user?.username || 'Utilizador'}!</h1>
        <h2>Aqui você poderá gerir as suas tarefas e membros da equipa.</h2>
      </hgroup>
      <p>
        Este é o seu painel de controlo principal. A partir daqui, você terá acesso a todas as
        funcionalidades para organizar o seu trabalho.
      </p>

      <div className="grid">
        <Link to="/minhas-tarefas" role="button" className="primary">
          Gerir Minhas Tarefas
        </Link>
        <Link to="/meus-membros" role="button" className="secondary">
          Gerir Meus Membros
        </Link>
        <Link to="/monitoramento-tarefas" role="button" className="contrast">
          Monitorizar Tarefas
        </Link>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h3>Próximos Passos:</h3>
        <ul>
          <li>Visualizar a sua lista de tarefas.</li>
          <li>Criar novas tarefas e atribuí-las a membros da equipa.</li>
          <li>Adicionar e gerir membros da sua equipa.</li>
          <li>Acompanhar o progresso das tarefas.</li>
        </ul>
      </section>

      {/* Você pode adicionar mais conteúdo ou componentes aqui conforme desenvolve */}
    </article>
  );
};

export default DashboardPage;

