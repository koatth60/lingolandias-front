import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/login/login';
import Home from './sections/home';
import Profile from './sections/profile';
import Admin from './components/admin/admin';
import Learning from './sections/learning';
import Shchedule from './components/schedule/schedule';
import RequireAuth from './components/requireAuth';
import JitsiClassRoom from './components/JitsiClassRoom';
import Messages from './sections/messages';
// import Trello from './sections/trello'; // Hidden — work in progress
import ForgotPassword from './components/login/forgotPassword';
import ResetPassword from './components/login/resetPassword';
import GlobalNotificationHandler from './components/GlobalNotificationHandler';
import FilePreviewModal from './components/FilePreviewModal';
import HelpCenter from './components/help-center/HelpCenter';
import Settings from './components/settings/Settings';
import { useSelector } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { userInfo } = useSelector((state) => state.user);
  const darkMode = userInfo?.user?.settings?.darkMode;

  return (
    <div className={`${darkMode ? 'dark' : ''} bg-brand-light dark:bg-brand-dark min-h-screen`}>
      <Router>
        <GlobalNotificationHandler />
        <FilePreviewModal />
        <ToastContainer
          position="bottom-left"
          autoClose={2500}
          limit={3}
          transition={Slide}
          newestOnTop
          theme="light"
        />
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="/learning"
            element={
              <RequireAuth>
                <Learning />
              </RequireAuth>
            }
          />
          <Route
            path="/schedule"
            element={
              <RequireAuth>
                <Shchedule />
              </RequireAuth>
            }
          />
          <Route
            path="/classroom"
            element={
              <RequireAuth>
                <JitsiClassRoom />
              </RequireAuth>
            }
          />
          <Route
            path="/messages"
            element={
              <RequireAuth>
                 <Messages  />
              </RequireAuth>
            }
          />
          {/* Trello route hidden — work in progress
           <Route
            path="/trello"
            element={
              <RequireAuth>
                 <Trello  />
              </RequireAuth>
            }
          /> */}
          <Route
            path="/help-center"
            element={
              <RequireAuth>
                <HelpCenter />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
           <Route path="/forgotpassword" element={<ForgotPassword />} />
           <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
