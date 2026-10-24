import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eventsApi } from '../services/api.js';
import { downloadText, formatDateTime, toCsv } from '../utils/format.js';

const COLUMNS = [
  { label: 'Name', value: (r) => r.user.name },
  { label: 'Email', value: (r) => r.user.email },
  { label: 'Department', value: (r) => r.user.department },
  { label: 'Roll number', value: (r) => r.user.rollNumber },
  { label: 'Registered at', value: (r) => new Date(r.createdAt).toISOString() },
];

export default function AdminRegistrations() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => eventsApi.registrations(id), [id]);

  if (loading) return <Loading label="Loading registrations…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { event, data: registrations } = data;

  const exportCsv = () => {
    const safeName = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    downloadText(`${safeName || 'event'}-registrations.csv`, toCsv(COLUMNS, registrations));
  };

  return (
    <>
      <Link to="/admin" className="back-link">
        ← Manage events
      </Link>
      <div className="page-head">
        <div>
          <h1>{event.title}</h1>
          <p>
            {formatDateTime(event.date)} · {event.venue} · {registrations.length} of {event.capacity} seats filled
          </p>
        </div>
        <button type="button" className="btn btn-primary" disabled={registrations.length === 0} onClick={exportCsv}>
          Download CSV
        </button>
      </div>

      {registrations.length === 0 ? (
        <EmptyState title="No registrations yet">
          <p>Students who register will appear here, in the order they signed up.</p>
        </EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Department</th>
                <th scope="col">Roll number</th>
                <th scope="col">Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r, index) => (
                <tr key={r._id}>
                  <td>{index + 1}</td>
                  <td className="cell-title">{r.user.name}</td>
                  <td style={{ overflowWrap: 'anywhere' }}>{r.user.email}</td>
                  <td>{r.user.department || '-'}</td>
                  <td>{r.user.rollNumber || '-'}</td>
                  <td>{formatDateTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
