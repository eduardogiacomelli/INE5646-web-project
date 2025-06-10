import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Ajuste o caminho para o AuthContext

const Navbar: React.FC = () => {
  const { isAuthenticated, logoutUser, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login'); // Redireciona para a página de login após o logout
  };

  return (
    <nav className="container-fluid"> {/* Classe do Pico.css para navegação */}
      <ul>
        <li>
          <Link to="/">
            <strong>Gestor de Tarefas Pro</strong> {/* Nome do App */}
          </Link>
        </li>
      </ul>
      <ul>
        <li><Link to="/">Home</Link></li>
        {isAuthenticated && user ? (
          <>
            {/* O link para o Dashboard será mais útil quando a página existir */}
            <li><Link to="/dashboard">Dashboard</Link></li>
            {/* Adicionar links para outras páginas protegidas aqui, se necessário no navbar */}
            {/* <li><Link to="/minhas-tarefas">Minhas Tarefas</Link></li> */}
            {/* <li><Link to="/meus-membros">Meus Membros</Link></li> */}
            <li>
              <details role="list" dir="rtl"> {/* Dropdown do Pico.css, alinhado à direita */}
                <summary aria-haspopup="listbox" role="button" className="secondary outline">
                  Olá, {user.username}
                </summary>
                <ul role="listbox">
                  {/* <li><Link to="/perfil">Meu Perfil</Link></li> */}
                  <li>
                    <a href="#!" onClick={handleLogout}>
                      Sair
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login" role="button" className="secondary">Login</Link></li>
            <li><Link to="/register" role="button">Cadastrar</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

