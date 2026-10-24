import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { dayOfMonth, formatTime, monthShort } from '../utils/format.js';

export default function EventRow({ event, registered = false, index = 0 }) {
  return (
    <li className="event-row" style={{ '--i': Math.min(index, 8) }}>
      <div className="date-block" aria-hidden="true">
        <span className="date-day">{dayOfMonth(event.date)}</span>
        <span className="date-month">{monthShort(event.date)}</span>
      </div>

      <div className="event-main">
        <h3>
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>
        <p className="meta">
          {formatTime(event.date)} · {event.venue}
        </p>
        <div className="chips">
          <span className="tag">{event.category}</span>
          <StatusBadge status={event.registrationStatus} />
          {registered && <span className="badge badge-ok">You are registered</span>}
        </div>
      </div>

      <div className="event-side">
        <span>
          {event.seatsLeft} of {event.capacity} seats left
        </span>
      </div>
    </li>
  );
}
