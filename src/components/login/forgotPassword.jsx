import { useState } from 'react';
import { FiMail, FiCheckCircle, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import Footer from './Footer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FLOATING_CHARS = [
  { char: '文', left: '4%',  delay: '0s',    duration: '16s', size: '1.5rem', color: '#9E2FD0', opacity: 0.18 },
  { char: 'A',  left: '11%', delay: '3s',    duration: '13s', size: '1.1rem', color: '#F6B82E', opacity: 0.14 },
  { char: 'の', left: '19%', delay: '7s',    duration: '17s', size: '1.7rem', color: '#26D9A1', opacity: 0.16 },
  { char: 'α',  left: '27%', delay: '1s',    duration: '14s', size: '1.2rem', color: '#c084fc', opacity: 0.15 },
  { char: 'Ñ',  left: '34%', delay: '5s',    duration: '15s', size: '1.3rem', color: '#F6B82E', opacity: 0.13 },
  { char: '한', left: '41%', delay: '9s',    duration: '12s', size: '1.6rem', color: '#9E2FD0', opacity: 0.17 },
  { char: 'Ü',  left: '49%', delay: '2s',    duration: '19s', size: '1.0rem', color: '#26D9A1', opacity: 0.12 },
  { char: '語', left: '57%', delay: '6s',    duration: '15s', size: '1.5rem', color: '#F6B82E', opacity: 0.16 },
  { char: 'β',  left: '64%', delay: '0.5s',  duration: '13s', size: '1.2rem', color: '#9E2FD0', opacity: 0.14 },
  { char: 'Ã',  left: '71%', delay: '4s',    duration: '18s', size: '1.1rem', color: '#26D9A1', opacity: 0.13 },
  { char: 'あ', left: '78%', delay: '8s',    duration: '14s', size: '1.6rem', color: '#c084fc', opacity: 0.17 },
  { char: 'π',  left: '85%', delay: '2.5s',  duration: '16s', size: '1.1rem', color: '#F6B82E', opacity: 0.12 },
  { char: '字', left: '92%', delay: '10s',   duration: '12s', size: '1.4rem', color: '#9E2FD0', opacity: 0.15 },
  { char: 'λ',  left: '16%', delay: '11s',   duration: '20s', size: '1.3rem', color: '#26D9A1', opacity: 0.13 },
  { char: '学', left: '52%', delay: '13s',   duration: '15s', size: '1.5rem', color: '#c084fc', opacity: 0.16 },
  { char: 'é',  left: '88%', delay: '1.5s',  duration: '11s', size: '1.0rem', color: '#F6B82E', opacity: 0.12 },
];

const FloatingChars = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {FLOATING_CHARS.map((item, i) => (
      <span
        key={i}
        className="login-char"
        style={{
          left: item.left,
          bottom: '-2rem',
          animationDelay: item.delay,
          animationDuration: item.duration,
          fontSize: item.size,
          color: item.color,
          opacity: item.opacity,
        }}
      >
        {item.char}
      </span>
    ))}
  </div>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'loading', message: 'Sending reset link...' });

    try {
      const response = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }

      setStatus({
        type: 'success',
        message: `If an account exists for ${email}, you'll receive password reset instructions shortly.`,
      });
      setEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send reset link. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pageShell = (children) => (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)' }}
    >
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="login-orb w-48 h-48 sm:w-80 sm:h-80 md:w-[520px] md:h-[520px] top-[-8%] left-[-8%]"
          style={{ background: 'radial-gradient(circle, rgba(158,47,208,0.35), transparent 70%)', animationDuration: '8s', animationDelay: '0s' }}
        />
        <div
          className="login-orb w-40 h-40 sm:w-64 sm:h-64 md:w-[420px] md:h-[420px] bottom-[-8%] right-[-6%]"
          style={{ background: 'radial-gradient(circle, rgba(246,184,46,0.22), transparent 70%)', animationDuration: '10s', animationDelay: '2s' }}
        />
        <div
          className="login-orb w-32 h-32 sm:w-52 sm:h-52 md:w-[320px] md:h-[320px] top-[38%] right-[22%]"
          style={{ background: 'radial-gradient(circle, rgba(38,217,161,0.14), transparent 70%)', animationDuration: '13s', animationDelay: '5s' }}
        />
      </div>

      {/* Floating language characters */}
      <FloatingChars />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-10 relative z-10">
        {children}
      </div>

      <Footer />
    </div>
  );

  if (status.type === 'success') {
    return pageShell(
      <div className="w-full max-w-md login-animate-slide-up">
        <div
          className="rounded-3xl p-8 border border-white/10 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Top accent */}
          <div
            className="h-px mb-8 opacity-40"
            style={{ background: 'linear-gradient(90deg, transparent, #26D9A1, #9E2FD0, transparent)' }}
          />

          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(38,217,161,0.12)', border: '1px solid rgba(38,217,161,0.3)' }}
          >
            <FiCheckCircle size={28} style={{ color: '#26D9A1' }} />
          </div>

          <h2 className="text-xl font-extrabold text-white mb-3">Reset Link Sent!</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">{status.message}</p>

          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-bold text-white text-sm transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #9E2FD0 0%, #7b22a8 50%, #b84a10 100%)',
              boxShadow: '0 4px 24px rgba(158,47,208,0.4)',
            }}
          >
            <FiArrowLeft size={15} />
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return pageShell(
    <div className="w-full max-w-md login-animate-slide-up">
      <div
        className="rounded-3xl p-8 border border-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Card header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
            Password Recovery
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-6 opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, transparent)' }}
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="group">
            <label className="block text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
              Email Address
            </label>
            <div className="relative">
              <FiMail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-purple-400 transition-colors duration-200"
                size={16}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus({ type: 'idle', message: '' });
                }}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 transition-all duration-200 outline-none border"
                style={{
                  background: status.type === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.05)',
                  borderColor: status.type === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => {
                  if (status.type !== 'error') {
                    e.target.style.borderColor = 'rgba(158,47,208,0.7)';
                    e.target.style.background = 'rgba(158,47,208,0.08)';
                  }
                }}
                onBlur={(e) => {
                  if (status.type !== 'error') {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {/* Status message */}
          {status.message && status.type !== 'loading' && (
            <div
              className="p-3 rounded-xl text-xs flex items-start gap-2 border"
              style={
                status.type === 'error'
                  ? { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }
                  : { background: 'rgba(38,217,161,0.08)', borderColor: 'rgba(38,217,161,0.25)' }
              }
            >
              <span style={{ color: status.type === 'error' ? '#ef4444' : '#26D9A1' }} className="shrink-0 mt-0.5">
                ⚠
              </span>
              <span style={{ color: status.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>{status.message}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className="relative w-full py-3 px-6 rounded-xl font-bold text-white text-sm overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #9E2FD0 0%, #7b22a8 50%, #b84a10 100%)',
              boxShadow: '0 4px 24px rgba(158,47,208,0.4)',
            }}
          >
            <span className="login-btn-shine absolute inset-0 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending reset link…
                </>
              ) : (
                <>
                  <FiMail size={15} />
                  Send Reset Link
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-200" size={15} />
                </>
              )}
            </span>
          </button>

          {/* Back to login */}
          <p className="text-center text-sm text-gray-500 pt-1">
            Remember your password?{' '}
            <a
              href="/login"
              className="text-purple-400 hover:text-orange-400 transition-colors duration-200 font-medium"
            >
              Sign in here
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
