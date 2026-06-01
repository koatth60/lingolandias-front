import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getToken = () => localStorage.getItem("token") || '';

export const socket = io(BACKEND_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
});