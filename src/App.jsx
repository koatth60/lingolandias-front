import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Login from './components/login/login';
import RequireAuth from './components/auth/requireAuth';
import GlobalNotificationHandler from './components/common/GlobalNotificationHandler';
import FilePreviewModal from './components/common/FilePreviewModal';
import { UploadProvider } from './context/UploadContext';
import UploadStatusBar from './components/common/UploadStatusBar';

// Lazy-load all post-login routes — keeps initial bundle small
const Home         = lazy(() => import('./sections/home'));
const Profile      = lazy(() => import('./sections/profile'));
const Admin        = lazy(() => import('./components/admin/admin'));
const Shchedule    = lazy(() => import('./components/schedule/schedule'));
const JitsiClassRoom = lazy(() => import('./components/classroom/JitsiClassRoom'));
const Messages     = lazy(() => import('./sections/messages'));
const Support      = lazy(() => import('./sections/support'));
const HelpCenter   = lazy(() => import('./components/help-center/HelpCenter'));
const Settings     = lazy(() => import('./components/settings/Settings'));
const ForgotPassword = lazy(() => import('./components/login/forgotPassword'));
const ResetPassword  = lazy(() => import('./components/login/resetPassword'));
const Trello       = lazy(() => import('./sections/trello'));
const AdminTrello  = lazy(() => import('./sections/adminTrello'));
const Analytics    = lazy(() => import('./sections/analytics'));
import { useSelector } from 'react-redux';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { userInfo } = useSelector((state) => state.user);
  const darkMode = userInfo?.user?.settings?.darkMode;
  const savedLanguage = userInfo?.user?.settings?.language;
  const { i18n } = useTranslation();

  // Apply dark class to <html> so Tailwind dark: selectors work everywhere,
  // including portal-rendered modals and native browser UI on all browsers/OS.
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync language from user settings to i18n on login/reload
  useEffect(() => {
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
      localStorage.setItem('language', savedLanguage);
    }
  }, [savedLanguage]);

  return (
    <UploadProvider>
    <div className="bg-brand-light dark:bg-brand-dark min-h-screen">
      <UploadStatusBar />
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
        <Suspense fallback={null}>
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
          {/* <Route
            path="/learning"
            element={
              <RequireAuth>
                <Learning />
              </RequireAuth>
            }
          /> */}
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
          <Route
            path="/trello"
            element={
              <RequireAuth>
                <Trello />
              </RequireAuth>
            }
          />
          <Route
            path="/admin-trello"
            element={
              <RequireAuth role="admin">
                <AdminTrello />
              </RequireAuth>
            }
          />
          <Route
            path="/analytics"
            element={
              <RequireAuth role="admin">
                <Analytics />
              </RequireAuth>
            }
          />
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
          <Route
            path="/support"
            element={
              <RequireAuth>
                <Support />
              </RequireAuth>
            }
          />
           <Route path="/forgotpassword" element={<ForgotPassword />} />
           <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        </Suspense>
      </Router>
    </div>
    </UploadProvider>
  );
}

export default App;
