import './api'; // Global axios auth interceptor — must be first
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Login from './components/login/login';
import RequireAuth from './components/auth/requireAuth';
import UnreadTabTitle from './components/common/UnreadTabTitle';
import NotificationsListener from './components/common/NotificationsListener';
import IncomingCallBanner from './components/common/IncomingCallBanner';
import UpdateAvailableBanner from './components/common/UpdateAvailableBanner';
import FilePreviewModal from './components/common/FilePreviewModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import { UploadProvider } from './context/UploadContext';
import UploadStatusBar from './components/common/UploadStatusBar';

// Lazy-load all post-login routes — keeps initial bundle small. The sidebar
// nav routes are imported from routePrefetch.js's shared map instead of an
// inline import() here, so that file and this one can never drift apart —
// dashboard.jsx uses the exact same functions to warm a chunk on hover.
import { routeImports } from './routePrefetch';
const Home         = lazy(routeImports['/home']);
const Profile      = lazy(routeImports['/profile']);
const Admin        = lazy(routeImports['/admin']);
const Shchedule    = lazy(routeImports['/schedule']);
const JitsiClassRoom = lazy(() => import('./components/classroom/JitsiClassRoom'));
const Messages     = lazy(routeImports['/messages']);
const Support      = lazy(routeImports['/support']);
const HelpCenter   = lazy(routeImports['/help-center']);
const Settings     = lazy(routeImports['/settings']);
const ForgotPassword = lazy(() => import('./components/login/forgotPassword'));
const ResetPassword  = lazy(() => import('./components/login/resetPassword'));
const Trello       = lazy(routeImports['/trello']);
const AdminTrello  = lazy(routeImports['/admin-trello']);
const AdminMeetingLogs = lazy(routeImports['/admin-meeting-logs']);
const Analytics    = lazy(routeImports['/analytics']);
const Recordings   = lazy(routeImports['/recordings']);
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
        <UnreadTabTitle />
        <NotificationsListener />
        <IncomingCallBanner />
        <UpdateAvailableBanner />
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
                <ErrorBoundary
                  fallback={
                    <div className="meeting-full-height flex flex-col items-center justify-center gap-4 bg-black text-white">
                      <p>Something went wrong loading the meeting.</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-full text-white text-sm font-semibold"
                        style={{ background: 'linear-gradient(135deg, #9E2FD0, #7b22a8)' }}
                      >
                        Reload
                      </button>
                    </div>
                  }
                  onError={(error) => {
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/meeting-logs`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        event: 'classroom_crash',
                        level: 'error',
                        detail: `${error?.message}\n${error?.stack || ''}`.slice(0, 4000),
                        userAgent: navigator.userAgent,
                      }),
                    }).catch(() => {});
                  }}
                >
                  <JitsiClassRoom />
                </ErrorBoundary>
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
            path="/admin-meeting-logs"
            element={
              <RequireAuth role="admin">
                <AdminMeetingLogs />
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
            path="/recordings"
            element={
              <RequireAuth>
                <Recordings />
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
