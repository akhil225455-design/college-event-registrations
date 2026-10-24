import { useEffect, useState } from 'react';
import EventRow from '../components/EventRow.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { eventsApi, registrationsApi } from '../services/api.js';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];
const PAGE_SIZE = 8;

export default function Home() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [page, setPage] = useState(1);

  // Wait until the student stops typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const events = useFetch(
    () => eventsApi.list({ page, limit: PAGE_SIZE, search, category, upcoming: upcomingOnly ? 'true' : 'false' }),
    [page, search, category, upcomingOnly]
  );
  const mine = useFetch(() => registrationsApi.mine(), [user?.id], { enabled: user?.role === 'student' });

  const registeredIds = new Set((mine.data?.data || []).map((r) => r.event._id));
  const filtersActive = Boolean(search || category);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Find your next campus event</h1>
          <p>Browse what is coming up, check how many seats are left and register in a couple of taps.</p>
        </div>
      </div>

      <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="search">Search by title</label>
          <input
            id="search"
            className="input"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => {
              setUpcomingOnly(e.target.checked);
              setPage(1);
            }}
          />
          Upcoming only
        </label>
      </form>

      {events.loading && <Loading label="Loading events…" />}
      {!events.loading && events.error && <ErrorState message={events.error} onRetry={events.reload} />}
      {!events.loading && !events.error && events.data && (
        <>
          {events.data.data.length === 0 ? (
            <EmptyState title={filtersActive ? 'No events match your search' : 'No events yet'}>
              <p>
                {filtersActive
                  ? 'Try a different title or category.'
                  : 'New events will appear here as soon as organisers publish them.'}
              </p>
            </EmptyState>
          ) : (
            <ul className="event-list">
              {events.data.data.map((event, index) => (
                <EventRow key={event._id} event={event} index={index} registered={registeredIds.has(event._id)} />
              ))}
            </ul>
          )}
          <Pagination page={events.data.page} totalPages={events.data.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
