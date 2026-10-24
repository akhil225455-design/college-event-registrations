import { useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eventsApi } from '../services/api.js';
import { formatDateTime } from '../utils/format.js';

export default function AdminDashboard() {
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState(null);

  const { data, loading, error, reload } = useFetch(() => eventsApi.list({ page, limit: 10 }), [page]);

  const remove = async (id) => {
    setDeletingId(id);
    setMessage(null);
    try {
      await eventsApi.remove(id);
      setMessage({ type: 'ok', text: 'Event deleted along with its registrations.' });
      setConfirmId('');
      // If that was the last event on this page, step back one page.
      if (data.data.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeletingId('');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Manage events</h1>
          <p>Create events, update details and see who has registered.</p>
        </div>
        <Link to="/admin/events/new" className="btn btn-primary">
          New event
        </Link>
      </div>

      <div aria-live="polite">
        {message && <p className={`alert ${message.type === 'ok' ? 'alert-ok' : 'alert-error'}`}>{message.text}</p>}
      </div>

      {loading && <Loading label="Loading events…" />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && data && (
        <>
          {data.data.length === 0 ? (
            <EmptyState title="No events yet">
              <p>Create the first event and students will see it right away.</p>
              <Link to="/admin/events/new" className="btn btn-primary">
                Create an event
              </Link>
            </EmptyState>
          ) : (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">When</th>
                    <th scope="col">Registered</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((event) => (
                    <tr key={event._id}>
                      <td className="cell-title">
                        <Link to={`/events/${event._id}`}>{event.title}</Link>
                        <div className="meta">{event.venue}</div>
                      </td>
                      <td>{formatDateTime(event.date)}</td>
                      <td>
                        {event.registeredCount} / {event.capacity}
                      </td>
                      <td>
                        <StatusBadge status={event.registrationStatus} />
                      </td>
                      <td>
                        <div className="actions">
                          {confirmId === event._id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                disabled={deletingId === event._id}
                                onClick={() => remove(event._id)}
                              >
                                {deletingId === event._id ? 'Deleting…' : 'Confirm delete'}
                              </button>
                              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmId('')}>
                                Keep
                              </button>
                            </>
                          ) : (
                            <>
                              <Link to={`/admin/events/${event._id}/registrations`} className="btn btn-quiet btn-sm">
                                Registrations
                              </Link>
                              <Link to={`/admin/events/${event._id}/edit`} className="btn btn-quiet btn-sm">
                                Edit
                              </Link>
                              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmId(event._id)}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
