import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '../components/States.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eventsApi } from '../services/api.js';
import { toInputValue } from '../utils/format.js';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];
const EMPTY = {
  title: '',
  description: '',
  category: 'Technical',
  venue: '',
  date: '',
  registrationDeadline: '',
  capacity: '50',
};

export default function AdminEventForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const existing = useFetch(() => eventsApi.get(id), [id], { enabled: editing });

  useEffect(() => {
    const item = existing.data?.data;
    if (item) {
      setForm({
        title: item.title,
        description: item.description,
        category: item.category,
        venue: item.venue,
        date: toInputValue(item.date),
        registrationDeadline: toInputValue(item.registrationDeadline),
        capacity: String(item.capacity),
      });
    }
  }, [existing.data]);

  if (editing && existing.loading) return <Loading label="Loading event…" />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;

  const update = (field) => (e) => setForm((previous) => ({ ...previous, [field]: e.target.value }));

  const validate = () => {
    if (form.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (form.description.trim().length < 10) return 'Description must be at least 10 characters.';
    if (form.venue.trim().length < 2) return 'Enter the venue.';
    if (!form.date) return 'Choose the event date and time.';
    if (!form.registrationDeadline) return 'Choose the registration deadline.';
    if (new Date(form.registrationDeadline) > new Date(form.date)) {
      return 'The registration deadline must be on or before the event date.';
    }
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity < 1) return 'Capacity must be a whole number of at least 1.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      venue: form.venue.trim(),
      date: new Date(form.date).toISOString(),
      registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      capacity: Number(form.capacity),
    };

    setBusy(true);
    try {
      if (editing) await eventsApi.update(id, payload);
      else await eventsApi.create(payload);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/admin" className="back-link">
        ← Manage events
      </Link>
      <div className="page-head">
        <h1>{editing ? 'Edit event' : 'New event'}</h1>
      </div>

      <form className="form form-wide" onSubmit={submit} noValidate>
        <div aria-live="polite">{error && <p className="alert alert-error">{error}</p>}</div>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" className="input" value={form.title} onChange={update('title')} maxLength={120} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            className="textarea"
            value={form.description}
            onChange={update('description')}
            maxLength={2000}
          />
          <p className="hint">{form.description.length} / 2000 characters</p>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" className="select" value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="venue">Venue</label>
            <input id="venue" className="input" value={form.venue} onChange={update('venue')} maxLength={120} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="date">Event date and time</label>
            <input id="date" className="input" type="datetime-local" value={form.date} onChange={update('date')} />
          </div>
          <div className="field">
            <label htmlFor="deadline">Registration deadline</label>
            <input
              id="deadline"
              className="input"
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={update('registrationDeadline')}
            />
          </div>
        </div>

        <div className="field" style={{ maxWidth: '12rem' }}>
          <label htmlFor="capacity">Capacity</label>
          <input
            id="capacity"
            className="input"
            type="number"
            inputMode="numeric"
            min="1"
            value={form.capacity}
            onChange={update('capacity')}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create event'}
          </button>
          <Link to="/admin" className="btn btn-quiet">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
