import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BrainCircuit } from 'lucide-react';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin123#';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Admin detection logic from original file
    const isAdminLogin = formData.email.toLowerCase() === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD;
    const role = isAdminLogin ? 'admin' : 'student';

    if (!isLogin && !formData.name.trim() && !isAdminLogin) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    
    // Register or login depending on mode
    // (If admin, we always attempt to login or register depending on if the account exists, 
    // but typically we should register the admin once or assume login mode. For simplicity,
    // let's pass the role to the backend)
    const userData = {
      ...( !isLogin ? { name: formData.name } : {}),
      email: formData.email,
      password: formData.password,
      role: role
    };

    const res = await login(userData, !isLogin);

    if (!res.success) {
      setError(res.message || 'Authentication failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="card auth-card text-center">
        <BrainCircuit size={48} className="text-primary mb-4" style={{ margin: '0 auto' }} />
        <h2 className="text-2xl font-bold mb-2">AI Exam Portal</h2>
        <p className="text-muted mb-6">Secure, Intelligent, Fair Assessment.</p>

        {error && (
          <div className="badge danger mb-4" style={{ display: 'block', padding: '0.75rem', borderRadius: 'var(--radius)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-left">
          {!isLogin && (
            <div>
              <label>Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div>
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="user@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label>Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" style={{ width: '100%' }} className="mt-2" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-sm text-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            className="text-primary font-medium" 
            style={{ cursor: 'pointer' }}
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
