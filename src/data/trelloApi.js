import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:2000';

// ─── BOARDS ──────────────────────────────────────────────────────────────────

export const getBoards = (userId) =>
  axios.get(`${API}/trello/boards`, { params: { userId } }).then((r) => r.data.boards);

export const createBoard = (data) =>
  axios.post(`${API}/trello/boards`, data).then((r) => r.data.board);

export const updateBoard = (id, data) =>
  axios.put(`${API}/trello/boards/${id}`, data).then((r) => r.data.board);

export const deleteBoard = (id) =>
  axios.delete(`${API}/trello/boards/${id}`).then((r) => r.data);

// ─── LISTS ───────────────────────────────────────────────────────────────────

export const getLists = (boardId) =>
  axios.get(`${API}/trello/boards/${boardId}/lists`).then((r) => r.data.lists);

export const createList = (boardId, name) =>
  axios.post(`${API}/trello/boards/${boardId}/lists`, { name }).then((r) => r.data.list);

export const updateList = (id, data) =>
  axios.put(`${API}/trello/lists/${id}`, data).then((r) => r.data.list);

export const deleteList = (id) =>
  axios.delete(`${API}/trello/lists/${id}`).then((r) => r.data);

export const reorderLists = (boardId, orderedIds) =>
  axios.put(`${API}/trello/boards/${boardId}/lists/reorder`, { orderedIds }).then((r) => r.data);

// ─── CARDS ───────────────────────────────────────────────────────────────────

export const createCard = (listId, data) =>
  axios.post(`${API}/trello/lists/${listId}/cards`, data).then((r) => r.data.card);

export const updateCard = (id, data) =>
  axios.put(`${API}/trello/cards/${id}`, data).then((r) => r.data.card);

export const deleteCard = (id) =>
  axios.delete(`${API}/trello/cards/${id}`).then((r) => r.data);

export const moveCard = (cardId, listId, position) =>
  axios.put(`${API}/trello/cards/${cardId}/move`, { listId, position }).then((r) => r.data.card);

export const reorderCards = (listId, orderedIds) =>
  axios.put(`${API}/trello/lists/${listId}/cards/reorder`, { orderedIds }).then((r) => r.data);

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export const getAllBoardsAdmin = () =>
  axios.get(`${API}/trello/admin/boards`).then((r) => r.data.boards);
