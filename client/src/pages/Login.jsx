import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    const from = location.state?.from?.pathname;
    return <Navigate to={from || (user.role === 'admin' ? '/admin' : '/')} replace />;
  }

  const update = (field) => (e) => setForm((previous) => ({ ...previous, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Log in</h1>
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <div aria-live="polite">{error && <p className="alert alert-error">{error}</p>}</div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </div>
      </form>
      <p className="form-footer">
        New here? <Link to="/register">Create a student account</Link>
      </p>
    </>
  );
}
