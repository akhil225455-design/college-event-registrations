const STATUS = {
  open: { label: 'Open', className: 'badge badge-ok' },
  full: { label: 'Full', className: 'badge badge-warn' },
  closed: { label: 'Registration closed', className: 'badge badge-muted' },
  ended: { label: 'Ended', className: 'badge badge-muted' },
};

export default function StatusBadge({ status }) {
  const { label, className } = STATUS[status] || STATUS.open;
  return <span className={className}>{label}</span>;
}
