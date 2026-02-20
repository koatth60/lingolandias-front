import { Link } from "react-router-dom";
import PropTypes from 'prop-types';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  handleLogin,
  userStatus,
  userError,
}) => {
  return (
    <div
      className="w-full md:w-auto md:min-w-[390px] max-w-md login-animate-slide-up"
      style={{ animationDelay: '0.25s' }}
    >
      {/* Glassmorphism card */}
      <div
        className="rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 border border-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Card header */}
        <div className="mb-4 md:mb-7 text-center">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
            Welcome back
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">
            Sign in to continue your language journey
          </p>
        </div>

        {/* Divider line with gradient */}
        <div
          className="h-px mb-4 md:mb-7 opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, transparent)' }}
        />

        <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
          {/* Email Input */}
          <div className="group">
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Email
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors duration-200"
                size={16}
              />
              <input
                className="w-full pl-11 pr-4 py-3 md:py-3.5 rounded-xl text-white text-sm placeholder-gray-600 transition-all duration-200 outline-none border"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(158,47,208,0.7)'; e.target.style.background = 'rgba(158,47,208,0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group">
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors duration-200"
                size={16}
              />
              <input
                className="w-full pl-11 pr-4 py-3 md:py-3.5 rounded-xl text-white text-sm placeholder-gray-600 transition-all duration-200 outline-none border"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(158,47,208,0.7)'; e.target.style.background = 'rgba(158,47,208,0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-gray-500 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30 focus:ring-offset-0"
              />
              <span className="text-xs group-hover:text-gray-300 transition-colors duration-200">Remember me</span>
            </label>
            <Link
              to="/forgotpassword"
              className="text-xs text-purple-400 hover:text-orange-400 transition-colors duration-200 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={userStatus === "loading"}
            className="relative w-full py-3 md:py-3.5 px-6 rounded-xl font-bold text-white text-sm overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] mt-1 md:mt-2"
            style={{
              background: 'linear-gradient(135deg, #9E2FD0 0%, #7b22a8 50%, #b84a10 100%)',
              boxShadow: '0 4px 24px rgba(158,47,208,0.4)',
            }}
          >
            {/* Shine sweep on hover */}
            <span className="login-btn-shine absolute inset-0 pointer-events-none" />

            <span className="relative flex items-center justify-center gap-2">
              {userStatus === "loading" ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Unlocking your world…
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={15} />
                </>
              )}
            </span>
          </button>

          {/* Error Message */}
          {userStatus === "failed" && (
            <div
              className="p-3 rounded-xl text-red-300 text-xs flex items-start gap-2 border"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
            >
              <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
              <span>{userError || "Those credentials don't look right. Please try again."}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

LoginForm.propTypes = {
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  handleLogin: PropTypes.func.isRequired,
  userStatus: PropTypes.string,
  userError: PropTypes.string,
};

export default LoginForm;
