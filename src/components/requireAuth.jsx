// src/components/RequireAuth.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { logout } from '../redux/userSlice';
import useGlobalSocket from '../hooks/useGlobalSocket';

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// eslint-disable-next-line react/prop-types
const RequireAuth = ({ children, role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const token = userInfo?.token;
  const userRole = userInfo?.user?.role;
  useGlobalSocket();

  useEffect(() => {
    if (!token) {
      navigate('/login', { state: { from: location }, replace: true });
    } else if (isTokenExpired(token)) {
      toast.error('Your session has expired. Please log in again.', { toastId: 'session-expired' });
      dispatch(logout());
      navigate('/login', { replace: true });
    } else if (role && userRole !== role) {
      navigate('/home', { replace: true });
    }
  }, [token, userRole, role, navigate, location, dispatch]);

  // If there's a token and the role matches (or no role is required), render the children
  return token && (!role || userRole === role) ? children : null;
};

export default RequireAuth;
