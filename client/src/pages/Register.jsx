import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', department: '', rollNumber: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm((previous) => ({ ...previous, [field]: e.target.value }));

  const validate = () => {
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(form.email.trim())) found.email = 'Enter a valid email address.';
    if (form.password.length < 8) found.password = 'Use at least 8 characters.';
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        rollNumber: form.rollNumber.trim(),
        password: form.password,
      });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  const fieldProps = (field) => ({
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Create a student account</h1>
          <p>You only need an account to register for events. Browsing is open to everyone.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <div aria-live="polite">{formError && <p className="alert alert-error">{formError}</p>}</div>

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" className="input" autoComplete="name" value={form.name} onChange={update('name')} {...fieldProps('name')} />
          {errors.name && (
            <p id="name-error" className="hint" style={{ color: 'var(--bad-ink)' }}>
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="email">College email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            {...fieldProps('email')}
          />
          {errors.email && (
            <p id="email-error" className="hint" style={{ color: 'var(--bad-ink)' }}>
              {errors.email}
            </p>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="department">Department (optional)</label>
            <input id="department" className="input" value={form.department} onChange={update('department')} maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="rollNumber">Roll number (optional)</label>
            <input id="rollNumber" className="input" value={form.rollNumber} onChange={update('rollNumber')} maxLength={30} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            {...fieldProps('password')}
          />
          {errors.password ? (
            <p id="password-error" className="hint" style={{ color: 'var(--bad-ink)' }}>
              {errors.password}
            </p>
          ) : (
            <p className="hint">At least 8 characters.</p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
      <p className="form-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </>
  );
}
