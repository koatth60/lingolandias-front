const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Auth header is injected automatically by the global fetch interceptor
// in src/api.js — these calls just need to hit the right BACKEND_URL path.

export const fetchInvitados = async () => {
  const res = await fetch(`${BACKEND_URL}/users/invitados`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to load invitados');
  return res.json();
};

export const createInvitado = async ({ name, lastName, email }) => {
  const res = await fetch(`${BACKEND_URL}/users/invitados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, lastName, email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create invitado');
  return data;
};

export const deleteInvitado = async (id) => {
  const res = await fetch(`${BACKEND_URL}/users/invitados/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to delete invitado');
  return res.json();
};
