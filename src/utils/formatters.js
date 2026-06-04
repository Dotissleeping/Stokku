export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return '₱' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  // SQLite stores datetime('now') in UTC — convert to local time
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  // SQLite stores datetime('now') in UTC — convert to local time
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getBalance = (customer) => {
  const bill = parseFloat(customer?.total_bill) || 0;
  const paid = parseFloat(customer?.total_paid) || 0;
  return Math.max(0, bill - paid);
};

export const isSettled = (customer) => {
  return getBalance(customer) === 0 && (parseFloat(customer?.total_bill) || 0) > 0;
};