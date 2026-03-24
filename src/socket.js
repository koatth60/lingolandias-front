import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getToken = () => {
  try {
    const s = JSON.parse(localStorage.getItem('state') || '{}');
    return s?.user?.userInfo?.token || '';
  } catch { return ''; }
};

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
});