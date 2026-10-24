import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge.jsx';
import { ErrorState, Loading } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eventsApi, registrationsApi } from '../services/api.js';
import { formatDateTime } from '../utils/format.js';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'ok' | 'error', text }

  const event = useFetch(() => eventsApi.get(id), [id]);
  const mine = useFetch(() => registrationsApi.mine(), [user?.id], { enabled: user?.role === 'student' });

  if (event.loading) return <Loading label="Loading event…" />;
  if (event.error) return <ErrorState message={event.error} onRetry={event.reload} />;

  const item = event.data.data;
  const registered = (mine.data?.data || []).some((r) => r.event._id === item._id);
  const canRegister = item.registrationStatus === 'open';

  const act = async (action) => {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await action(item._id);
      setFeedback({ type: 'ok', text: result.message });
      event.reload();
      mine.reload();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="detail">
      <div>
        <Link to="/" className="back-link">
          ← All events
        </Link>
        <h1>{item.title}</h1>
        <div className="chips" style={{ marginTop: '0.75rem' }}>
          <span className="tag">{item.category}</span>
          <StatusBadge status={item.registrationStatus} />
          {registered && <span className="badge badge-ok">You are registered</span>}
        </div>
      </div>

      <dl className="detail-facts">
        <div>
          <dt>When</dt>
          <dd>{formatDateTime(item.date)}</dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>{item.venue}</dd>
        </div>
        <div>
          <dt>Register by</dt>
          <dd>{formatDateTime(item.registrationDeadline)}</dd>
        </div>
        <div>
          <dt>Seats left</dt>
          <dd>
            {item.seatsLeft} of {item.capacity}
          </dd>
        </div>
      </dl>

      <p className="detail-body">{item.description}</p>

      <div aria-live="polite">
        {feedback && <p className={`alert ${feedback.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>{feedback.text}</p>}
      </div>

      <div className="form-actions">
        {!user && (
          <Link to="/login" state={{ from: location }} className="btn btn-primary">
            Log in to register
          </Link>
        )}

        {user?.role === 'student' && !registered && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !canRegister}
            onClick={() => act(eventsApi.register)}
          >
            {busy ? 'Registering…' : canRegister ? 'Register for this event' : 'Registration unavailable'}
          </button>
        )}

        {user?.role === 'student' && registered && (
          <button
            type="button"
            className="btn btn-quiet"
            disabled={busy || item.registrationStatus === 'ended'}
            onClick={() => act(eventsApi.cancel)}
          >
            {busy ? 'Cancelling…' : 'Cancel my registration'}
          </button>
        )}

        {user?.role === 'admin' && (
          <>
            <Link to={`/admin/events/${item._id}/edit`} className="btn btn-quiet">
              Edit event
            </Link>
            <Link to={`/admin/events/${item._id}/registrations`} className="btn btn-primary">
              View registrations
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
