import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eventsApi, registrationsApi } from '../services/api.js';
import { formatDateTime } from '../utils/format.js';

export default function MyRegistrations() {
  const { data, loading, error, reload } = useFetch(() => registrationsApi.mine());
  const [cancellingId, setCancellingId] = useState('');
  const [message, setMessage] = useState(null);

  const cancel = async (eventId) => {
    setCancellingId(eventId);
    setMessage(null);
    try {
      const result = await eventsApi.cancel(eventId);
      setMessage({ type: 'ok', text: result.message });
      reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCancellingId('');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My registrations</h1>
          <p>Events you have signed up for, soonest first.</p>
        </div>
      </div>

      <div aria-live="polite">
        {message && <p className={`alert ${message.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>{message.text}</p>}
      </div>

      {loading && <Loading label="Loading your registrations…" />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && data && (
        <>
          {data.data.length === 0 ? (
            <EmptyState title="You have not registered for anything yet">
              <p>Pick an event you like and it will show up here.</p>
              <Link to="/" className="btn btn-primary">
                Browse events
              </Link>
            </EmptyState>
          ) : (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">When</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.data]
                    .sort((a, b) => new Date(a.event.date) - new Date(b.event.date))
                    .map(({ _id, event }) => (
                      <tr key={_id}>
                        <td className="cell-title">
                          <Link to={`/events/${event._id}`}>{event.title}</Link>
                          <div className="meta">{event.venue}</div>
                        </td>
                        <td>{formatDateTime(event.date)}</td>
                        <td>
                          <StatusBadge status={event.registrationStatus} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm"
                            disabled={cancellingId === event._id || event.registrationStatus === 'ended'}
                            onClick={() => cancel(event._id)}
                          >
                            {cancellingId === event._id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
