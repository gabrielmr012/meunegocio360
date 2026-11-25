import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Container, Form, Nav, Navbar } from 'react-bootstrap';
import { useAuth } from '../../auth/index.js';
import { useEmpresa } from '../hooks/EmpresaContext.jsx';
import { PERFIS } from '../../../shared/lib/perfis.js';
import logoBranca from '../../../assets/logo_meunegocio360_v1_branca.png';

export default function AppLayout({ children }) {
  const { usuario, logout } = useAuth();
  const { empresa } = useEmpresa();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const nomeEmpresa =
    empresa?.nomeFantasia?.trim() || empresa?.razaoSocial || 'MeuNegócio360';
  const search = searchText.trim().toLocaleLowerCase('pt-BR');
  const menuItems = [
    { label: 'Início', to: '/', allowed: Object.values(PERFIS) },
    { label: 'Empresa', to: '/empresa', allowed: Object.values(PERFIS) },
    {
      label: 'Clientes',
      to: '/clientes',
      allowed: [PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL],
    },
  ]
    .filter((item) => item.allowed.includes(usuario?.perfil))
    .filter((item) => !search || item.label.toLocaleLowerCase('pt-BR').includes(search));

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSearchToggle = () => {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchText('');
      setExpanded(false);
      return;
    }
    setSearchOpen(true);
    setExpanded(true);
  };

  const closeMenu = () => {
    setExpanded(false);
    setSearchOpen(false);
    setSearchText('');
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar
        expand="lg"
        bg="primary"
        variant="light"
        expanded={expanded}
        onToggle={setExpanded}
        className="app-navbar"
      >
        <Container fluid="lg" className="position-relative">
          <Navbar.Toggle
            aria-controls="menu-principal"
            label={expanded ? 'Fechar menu' : 'Abrir menu'}
            className="app-navbar-toggler"
          />

          <Navbar.Brand
            as={NavLink}
            to="/"
            className="app-brand-desktop me-4"
            aria-label="MeuNegócio360 - início"
            onClick={closeMenu}
          >
            <img src={logoBranca} alt="" className="app-brand-image" />
          </Navbar.Brand>

          <Navbar.Brand
            as={NavLink}
            to="/"
            className="app-brand-mobile"
            aria-label="MeuNegócio360 - início"
            onClick={closeMenu}
          >
            <img src={logoBranca} alt="" className="app-brand-image" />
          </Navbar.Brand>

          <button
            type="button"
            className="btn app-navbar-search d-lg-none"
            aria-label={searchOpen ? 'Fechar pesquisa' : 'Pesquisar no menu'}
            aria-expanded={searchOpen}
            aria-controls="menu-pesquisa"
            onClick={handleSearchToggle}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="11"
                cy="11"
                r="7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.5 16.5 21 21"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </button>

          <Navbar.Collapse id="menu-principal">
            {searchOpen && (
              <Form
                className="py-2 d-lg-none"
                onSubmit={(event) => event.preventDefault()}
              >
                <Form.Label htmlFor="menu-pesquisa" className="visually-hidden">
                  Pesquisar no menu
                </Form.Label>
                <Form.Control
                  id="menu-pesquisa"
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Pesquisar no menu"
                />
              </Form>
            )}
            <Nav className="me-auto app-menu" aria-label="Menu principal">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `nav-link app-nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              ))}
              {searchOpen && menuItems.length === 0 && (
                <span className="nav-link text-dark">Nenhum item encontrado.</span>
              )}
            </Nav>

            <div className="d-flex flex-lg-row flex-column align-items-lg-center gap-lg-3 mt-3 mt-lg-0 app-user-actions">
              <span className="small text-dark">
                <strong>{nomeEmpresa}</strong>
                {usuario?.nome && (
                  <>
                    <span className="d-none d-lg-inline"> · </span>
                    <span className="d-lg-inline">{usuario.nome}</span>
                  </>
                )}
              </span>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm app-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? 'Saindo…' : 'Sair'}
              </button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="flex-grow-1">{children}</div>
    </div>
  );
}
