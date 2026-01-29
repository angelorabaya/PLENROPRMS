type StoredUser = {
  username?: string;
  name?: string;
};

const safeParseUser = (value: string | null): StoredUser | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as StoredUser;
  } catch {
    return null;
  }
};

export const getAuditHeaders = (includeJson = true): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  const stored = safeParseUser(localStorage.getItem('currentUser'));
  if (stored?.username) {
    headers['x-log-user'] = String(stored.username);
  }
  if (stored?.name) {
    headers['x-log-cname'] = String(stored.name);
  }

  return headers;
};
