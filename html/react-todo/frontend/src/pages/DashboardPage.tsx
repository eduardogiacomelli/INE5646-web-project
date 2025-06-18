// frontend/src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth(); 

  return (
    <article>
      <hgroup>
        <h1>Bem-vindo ao seu Dashboard, {user?.username || 'Usuário'}!</h1>
        <hr />
	<h2>Aqui você poderá criar membros e tarefas e associa-los.</h2>
      </hgroup>
      <p>
        Este é o seu painel de controle. A partir daqui, você terá acesso a todas as
        funcionalidades para organizar o seu trabalho.
      </p>

      <div className="grid">
        <Link to="/minhas-tarefas" role="button" className="primary">
          Gerenciar Minhas Tarefas
        </Link>
        <Link to="/meus-membros" role="button" className="secondary">
          Gerenciar Meus Membros
        </Link>
        <Link to="/monitoramento-tarefas" role="button" className="contrast">
          Monitorar Tarefas
        </Link>
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h3>Próximos Passos:</h3>
        <ul>
          <li>Visualizar a sua lista de tarefas.</li>
          <li>Criar novas tarefas e atribuí-las a membros criados.</li>
          <li>Adicionar e gerenciar quais membros são responsáveis por quais tarefas.</li>
          <li>Acompanhar o progresso das suas tarefas.</li>
        </ul>
      </section>

      
    </article>
  );
};

export default DashboardPage;

