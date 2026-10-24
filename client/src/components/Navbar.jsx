import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container">
        <NavLink to="/" className="brand">
          Campus<span>Connect</span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end>
            Events
          </NavLink>
          {user?.role === 'student' && <NavLink to="/my-registrations">My registrations</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Manage events</NavLink>}
          {user ? (
            <>
              <span className="nav-user">{user.name}</span>
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Sign up</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
