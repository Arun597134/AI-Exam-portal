import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="St. Joseph's Institute of Technology" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
      </Link>
      
      {user && (
        <div className="nav-links">
          <span className="text-muted text-sm">Welcome, {user.name} ({user.role})</span>
          {user.role === 'admin' && (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/generator">Generate Exam</Link>
            </>
          )}
          {user.role === 'student' && (
            <>
              <Link to="/student">Exams</Link>
            </>
          )}
          <button onClick={handleLogout} className="secondary flex align-center gap-2 m-0" style={{ padding: '0.25rem 0.75rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
