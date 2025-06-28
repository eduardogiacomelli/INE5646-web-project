import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// --- Hook customizado para detectar o tamanho da tela ---
const useWindowSize = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useLayoutEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    handleResize(); // Garante o valor inicial correto na montagem
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

// --- Ícone de Hambúrguer (SVG) ---
const HamburgerIcon = () => (
  <svg fill="var(--pico-contrast)" viewBox="0 0 100 80" width="25" height="25">
    <rect width="100" height="15" rx="8"></rect>
    <rect y="30" width="100" height="15" rx="8"></rect>
    <rect y="60" width="100" height="15" rx="8"></rect>
  </svg>
);

// --- Componente de Avatar com Iniciais ---
const UserAvatar = ({ username }: { username: string }) => {
  const initials = username.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  const backgroundColor = `hsl(${h}, 60%, 88%)`;
  const color = `hsl(${h}, 70%, 30%)`;
  return (
    <div style={{
      width: '38px', height: '38px', borderRadius: '50%', backgroundColor, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase',
    }}>
      {initials}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: NAVBAR ---
const Navbar: React.FC = () => {
  const { isAuthenticated, logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowSize();
  const isMobile = width <= 992;

  // Fecha qualquer dropdown ao navegar para uma nova página
  useEffect(() => {
    const dropdowns = document.querySelectorAll<HTMLDetailsElement>('header nav details');
    dropdowns.forEach(dropdown => dropdown.removeAttribute('open'));
  }, [location]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Estilo para o link ativo, para evitar repetição
  const activeLinkStyle = {
    color: 'var(--pico-primary)',
    fontWeight: 'bold',
  } as React.CSSProperties;

  // Componente interno para os links de navegação
  const NavLinks: React.FC = () => (
    <>
      <li><NavLink to="/dashboard" style={({isActive}) => isActive ? activeLinkStyle : undefined}>Dashboard</NavLink></li>
      <li><NavLink to="/minhas-tarefas" style={({isActive}) => isActive ? activeLinkStyle : undefined}>Tarefas</NavLink></li>
      <li><NavLink to="/meus-membros" style={({isActive}) => isActive ? activeLinkStyle : undefined}>Equipe</NavLink></li>
      <li><NavLink to="/monitoramento-tarefas" style={({isActive}) => isActive ? activeLinkStyle : undefined}>Monitoramento</NavLink></li>
    </>
  );

  return (
    <header className="container-fluid" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'var(--pico-card-background-color)', boxShadow: 'var(--pico-card-box-shadow)', padding: '0 1.5rem' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '65px', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Lado Esquerdo: Marca do Site */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Gerenciador de Tarefas
        </Link>
        
        {/* Centro: Navegação de Desktop (só aparece em telas grandes e se estiver logado) */}
        {!isMobile && isAuthenticated && (
          <ul style={{ display: 'flex', gap: '1.5rem', margin: 0, listStyle: 'none', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <NavLinks />
          </ul>
        )}
        
        {/* Lado Direito: Ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated && user ? (
            // --- MENU DO USUÁRIO LOGADO ---
            <>
              {/* Hambúrguer só aparece em mobile */}
              {isMobile && (
                <details role="list" className="dropdown">
                  <summary aria-haspopup="listbox" role="button" className="contrast outline" style={{ padding: '0.5rem', margin: 0 }}>
                    <HamburgerIcon />
                  </summary>
                  <ul role="listbox" style={{ width: '250px' }}>
                    <NavLinks />
                  </ul>
                </details>
              )}
              {/* Avatar e menu de sair (sempre visível quando logado) */}
              <details role="list" className="dropdown">
                <summary aria-haspopup="listbox" style={{ padding: '0.3rem 0.75rem', borderRadius: 'var(--pico-border-radius)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <UserAvatar username={user.username} />
                  {!isMobile && <span style={{ fontWeight: 500 }}>{user.username.split(' ')[0]}</span>}
                </summary>
                <ul role="listbox">
                  <li><a href="#!" onClick={handleLogout}>Sair</a></li>
                </ul>
              </details>
            </>
          ) : null }
        </div>
      </nav>
    </header>
  );
};

export default Navbar;

