const dateFormat = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });
const monthFormat = new Intl.DateTimeFormat('en-IN', { month: 'short' });

export const formatDate = (value) => dateFormat.format(new Date(value));
export const formatTime = (value) => timeFormat.format(new Date(value));
export const formatDateTime = (value) => `${formatDate(value)}, ${formatTime(value)}`;
export const monthShort = (value) => monthFormat.format(new Date(value));
export const dayOfMonth = (value) => new Date(value).getDate();

// <input type="datetime-local"> wants local time as YYYY-MM-DDTHH:mm
export function toInputValue(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Builds CSV text. Cells starting with = + - @ get a leading apostrophe so spreadsheets never run them as formulas.
export function toCsv(columns, rows) {
  const escape = (cell) => {
    let text = String(cell ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  return [header, ...lines].join('\n');
}

export function downloadText(filename, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
