import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../redux/userSlice";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const useAuthExpiry = (userId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let exp;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      exp = payload.exp;
    } catch {
      return;
    }

    const expiresIn = exp * 1000 - Date.now();

    async function handleExpiry() {
      try {
        if (userId) {
          await axios.post(`${BACKEND_URL}/auth/logout`, { userId });
        }
      } catch {}
      dispatch(logout());
      navigate("/");
    }

    if (expiresIn <= 0) {
      handleExpiry();
      return;
    }

    const timer = setTimeout(handleExpiry, expiresIn);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
};

export default useAuthExpiry;
