import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <>
      {/* Seção Principal (Hero) */}
      <header style={{ textAlign: 'center', padding: '3rem 0' }}>
        
          <h1>Transformando a Gestão de Tarefas</h1>
          <p>Uma abordagem moderna e eficiente para organizar seu trabalho e impulsionar sua produtividade.</p>
       
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/register" role="button" className="primary">
            Criar Conta
          </Link>
          <Link to="/login" role="button" className="secondary" style={{ marginLeft: '0.5rem' }}>
            Entrar
          </Link>
        </div>
      </header>

      {/* Seção de Motivação e Objetivos lado a lado */}
      <section id="sobre" style={{ marginBottom: '4rem' }}>
        <div className="grid">
          <article>
            
              <header><h3>💡 Motivação</h3></header>
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
            
             <header><h3>🎯 Objetivos</h3></header>
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

      {/* Seção de Funcionalidades */}
      <section id="funcionalidades" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🛠️ Principais Funcionalidades</h2>
        <div className="grid">
          <article>
            <header><h5>👤 Cadastro e Perfil de Usuário</h5> </header>
            <p>
              Permitirá que os usuários se cadastrem e se autentifiquem, provendo segurança e confiabilidade. Seus dados de perfil são autenticados e guardados de forma segura, permitindo acessar sua conta de qualquer dispositivo conectado a rede da UFSC, facilitando a gestão de tarefas importantes e garantindo uma boa experiência de uso.
            </p>
          </article>
          <article>
            <header><h5>👥 Gestão de Membros</h5></header>
            <p>
              Será possível criar e gerenciar membros (ou funcionários) e associa-los livremente as tarefas criadas.
              Isso possibilitará o controle e a organização dos colaboradores de forma prática e
              eficiente.
            </p>
          </article>
          <article>
            <header><h5>📋 Gerenciamento de Tarefas</h5></header>
            <p>
              Usuários poderão criar, editar, excluir, e acompanhar as suas tarefas, associando-as a membros
              específicos. Essa funcionalidade visa organizar o fluxo de trabalho, facilitando o
              gerenciamento das atividades e promovendo a produtividade em equipe.
            </p>
          </article>
        </div>
      </section>
      
      {/* Seção "O Que Buscamos Atingir" */}
      <section id="nossa-meta" style={{ marginBottom: '4rem' }}>
        <article>
          
            <header><h2 style={{ textAlign: 'center' }}>🌟 O Que Buscamos Atingir</h2></header>
            <p>
              Nosso objetivo é criar uma ferramenta que realmente ajude no dia a dia — simples de
              usar, mas poderosa no que entrega. Buscamos oferecer uma experiência fluida, onde
              organizar tarefas, acompanhar o progresso e visualizar prioridades aconteça de forma
              natural. A ideia é que tudo funcione de maneira intuitiva, sem distrações
              desnecessárias, para que você possa focar no que realmente importa.
            </p>
          
        </article>
      </section>

      {/* Seção "Quem Somos" */}
      <section id="quem-somos">
        <article>
          
          <header>  <h3 style={{ textAlign: 'center' }}>🧑‍💻 Quem Somos Nós</h3></header>
          
          <p style={{ textAlign: 'center', color: 'var(--pico-muted-color)' }}>
            <strong>Membros do Grupo:</strong> Eduardo Wallner Giacomelli & Matias Adrian Fuks
            <br />
            <strong>Disciplina:</strong> INE5646 - Programação para Web
          </p>
        </article>
      </section>
    </>
  );
};

export default HomePage;

