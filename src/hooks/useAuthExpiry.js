import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../redux/userSlice";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// How often an open tab re-extends its own session, on top of the refresh
// that already happens once per app load/reopen — covers someone who just
// never closes the tab for weeks at a time.
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24h
// setTimeout's delay is a 32-bit signed int internally — anything past this
// (~24.8 days) silently overflows and fires almost immediately instead of
// waiting. With tokens now living 30 days, scheduleExpiry MUST chain shorter
// waits instead of handing setTimeout the full remaining time in one call.
const MAX_TIMEOUT = 2147483647;

const decodeExp = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1])).exp;
  } catch {
    return null;
  }
};

const useAuthExpiry = (userId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    let expiryTimer;
    let cancelled = false;

    async function handleExpiry() {
      try {
        await axios.post(`${BACKEND_URL}/auth/logout`, { userId });
      } catch {}
      dispatch(logout());
      navigate("/");
    }

    const scheduleExpiry = (token) => {
      const exp = decodeExp(token);
      if (!exp) return;
      const expiresIn = exp * 1000 - Date.now();
      clearTimeout(expiryTimer);
      if (expiresIn <= 0) {
        handleExpiry();
        return;
      }
      if (expiresIn > MAX_TIMEOUT) {
        // Can't wait the full remaining time in one setTimeout — wait the
        // max chunk, then re-derive the (now smaller) remaining time from
        // the token's real exp and try again.
        expiryTimer = setTimeout(() => scheduleExpiry(token), MAX_TIMEOUT);
        return;
      }
      expiryTimer = setTimeout(handleExpiry, expiresIn);
    };

    // Extiende la sesión mientras el token siga siendo válido — así, con tal
    // de que el usuario abra la app al menos una vez dentro del periodo de
    // expiración (30d, ver app.module.ts en el backend) o la deje abierta
    // (el interval de abajo), nunca lo saca a la fuerza, igual que
    // Skype/WhatsApp Web. Si el refresh falla (red caída, backend
    // momentáneamente abajo) no es fatal: el timer ya armado con el token
    // actual sigue vigente y se reintenta en el próximo ciclo.
    async function refreshSession() {
      const token = localStorage.getItem("token");
      if (!token) return;
      const exp = decodeExp(token);
      if (!exp) return;
      if (exp * 1000 - Date.now() <= 0) {
        handleExpiry();
        return;
      }
      try {
        const { data } = await axios.post(
          `${BACKEND_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (cancelled) return;
        localStorage.setItem("token", data.token);
        scheduleExpiry(data.token);
      } catch {}
    }

    const token = localStorage.getItem("token");
    if (!token) return undefined;
    scheduleExpiry(token);
    refreshSession();
    const refreshInterval = setInterval(refreshSession, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearTimeout(expiryTimer);
      clearInterval(refreshInterval);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useAuthExpiry;
