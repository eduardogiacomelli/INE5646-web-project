import React from 'react';
import { Link } from 'react-router-dom'; // Para links de navegação interna

const HomePage: React.FC = () => {
  return (
    <>
      {/* Seção Hero - Cabeçalho da Página */}
      <header className="container" style={{ textAlign: 'center', padding: '3rem 0' }}>
        {/* Usando <article> do Pico.css para um destaque visual */}
        <article>
          <hgroup>
            <h1>Transformando a Gestão de Tarefas</h1>
            <h2>Uma abordagem moderna e eficiente para organizar seu trabalho e impulsionar sua produtividade.</h2>
          </hgroup>
          <p>
            {/* Link para a página de cadastro, estilizado como botão primário */}
            <Link to="/register" role="button" className="primary contrast">
              Comece Agora Gratuitamente
            </Link>
            {' '} {/* Espaço entre botões */}
            <Link to="/login" role="button" className="secondary contrast">
              Já Tenho Conta
            </Link>
          </p>
        </article>
      </header>

      {/* Seção "Descubra as Funcionalidades" / Motivação e Objetivos */}
      <section id="descubra" className="container" style={{ marginBottom: '3rem' }}>
        <h2>Descubra as Funcionalidades</h2>
        <div className="grid"> {/* Grid do Pico.css para layout em colunas */}
          <article>
            <h3>💡 Motivação</h3>
            <p>
              A ideia surgiu da vontade de tornar a rotina mais leve e organizada. Em meio a tantas
              tarefas, compromissos e ideias espalhadas, sentimos falta de uma ferramenta simples que
              realmente ajudasse a manter o foco e trazer clareza ao dia a dia. Criamos esta
              plataforma para ser um espaço prático e confiável, onde você pode registrar,
              acompanhar e gerenciar suas atividades com facilidade. Tudo com a segurança
              necessária para que você possa se concentrar no que importa, sem preocupações.
            </p>
          </article>
          <article>
            <h3>🎯 Objetivos</h3>
            <p>
              Nosso principal objetivo é desenvolver uma plataforma de gerenciamento de tarefas
              robusta, intuitiva e visualmente agradável. Buscamos:
            </p>
            <ul>
              <li>Facilitar o planejamento e acompanhamento de projetos.</li>
              <li>Melhorar a colaboração entre membros da equipe.</li>
              <li>Oferecer uma experiência de usuário fluida e personalizável.</li>
              <li>Garantir a segurança e privacidade dos dados dos usuários.</li>
              <li>Tornar o gerenciamento de tarefas uma atividade motivadora e não uma sobrecarga.</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Seção "Funcionalidades Planejadas" */}
      <section id="funcionalidades" className="container" style={{ marginBottom: '3rem' }}>
        <h2>🛠️ Funcionalidades Planejadas</h2>
        {/* Usando a classe .features-grid que definimos no global.css */}
        <div className="features-grid">
          <div className="feature-card">
            <span className="icon" role="img" aria-label="Ícone de Usuário">👤</span>
            <h3>Cadastro e Perfil de Usuário</h3>
            <p>
              Permitirá que os usuários se cadastrem e atualizem seus dados pessoais. Cada usuário
              terá um perfil customizado, facilitando a gestão individual e garantindo uma
              experiência personalizada.
            </p>
          </div>
          <div className="feature-card">
            <span className="icon" role="img" aria-label="Ícone de Grupo de Pessoas">👥</span>
            <h3>Gestão de Membros</h3>
            <p>
              Será possível criar e gerenciar membros (ou funcionários) e associá-los a equipes.
              Isso possibilitará o controle e a organização dos colaboradores de forma prática e
              eficiente.
            </p>
          </div>
          <div className="feature-card">
            <span className="icon" role="img" aria-label="Ícone de Lista de Tarefas">📋</span>
            <h3>Gerenciamento de Tarefas</h3>
            <p>
              Usuários poderão criar, editar e excluir tarefas, associando-as a membros
              específicos. Essa funcionalidade visa organizar o fluxo de trabalho, facilitando o
              gerenciamento das atividades e promovendo a produtividade em equipe.
            </p>
          </div>
        </div>
      </section>

      {/* Seção "O Que Buscamos Atingir" */}
      <section id="nossa-meta" className="container" style={{ marginBottom: '3rem' }}>
        <article> {/* Usando <article> para dar um destaque */}
          <h2>🌟 O Que Buscamos Atingir</h2>
          <p>
            Nosso objetivo é criar uma ferramenta que realmente ajude no dia a dia — simples de
            usar, mas poderosa no que entrega. Buscamos oferecer uma experiência fluida, onde
            organizar tarefas, acompanhar o progresso e visualizar prioridades aconteça de forma
            natural. A ideia é que tudo funcione de maneira intuitiva, sem distrações
            desnecessárias, para que você possa focar no que realmente importa.
          </p>
        </article>
      </section>

      {/* Seção "Quem Somos Nós" */}
      <section id="quem-somos" className="container">
        <h2>🧑‍💻 Quem Somos Nós</h2>
        <p>Membros do Grupo:</p>
        <ul>
          <li>Eduardo Wallner Giacomelli</li>
          <li>Matias Adrian Fuks</li>
        </ul>
        <p>
          <strong>Disciplina:</strong> INE5646 - Programação para Web
          <br />
          {/* Link para o Moodle, se aplicável e você tiver o URL */}
          {/* <a href="URL_DO_MOODLE_AQUI" target="_blank" rel="noopener noreferrer">
            Moodle da Disciplina
          </a> */}
        </p>
      </section>
    </>
  );
};

export default HomePage;
