import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States.jsx';

export default function NotFound() {
  return (
    <EmptyState title="This page does not exist">
      <p>The link may be old, or the address may have a typo.</p>
      <Link to="/" className="btn btn-primary">
        Back to events
      </Link>
    </EmptyState>
  );
}
