import logo from "/src/assets/logos/logo3.png";

const LANGUAGE_BADGES = [
  { flag: '🇬🇧', lang: 'English' },
  { flag: '🇪🇸', lang: 'Español' },
  { flag: '🇫🇷', lang: 'Français' },
  { flag: '🇩🇪', lang: 'Deutsch' },
  { flag: '🇯🇵', lang: '日本語' },
  { flag: '🇨🇳', lang: '中文' },
];

const AnimatedLogo = () => (
  <div
    className="w-full md:w-1/2 max-w-xl flex flex-col items-center justify-center px-2 sm:px-4 md:px-8 login-animate-slide-up"
    style={{ animationDelay: '0.1s' }}
  >
    {/*
      Explicit size on the container matches the image exactly.
      This guarantees every absolute child (ring, glow, dots) expands
      symmetrically from the same well-defined bounding box.
    */}
    <div className="relative w-44 h-44 sm:w-60 sm:h-60 md:w-80 md:h-80 group cursor-pointer select-none">

      {/* Ambient glow — soft purple halo behind logo */}
      <div
        className="absolute rounded-full blur-2xl opacity-50 pointer-events-none"
        style={{
          inset: '-25%',
          background: 'radial-gradient(circle, rgba(158,47,208,0.55), rgba(246,184,46,0.15), transparent 70%)',
        }}
      />

      {/*
        Spinning gradient ring.
        The conic-gradient fills the entire div, then the mask punches out the
        center so only the outer ~3px edge is visible — a true ring, not a disc.
      */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-5px',
          background: 'conic-gradient(from 0deg, #9E2FD0, #c084fc, #F6B82E, #26D9A1, #9E2FD0)',
          animation: 'spin 7s linear infinite',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
          mask:        'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
          opacity: 0.85,
        }}
      />

      {/* Logo — fills the explicit container */}
      <img
        src={logo}
        alt="Lingolandias Logo"
        className="relative w-full h-full object-contain login-animate-float login-animate-glow transition-transform duration-500 group-hover:scale-105"
      />

      {/* Pulsing accent dot — top right */}
      <span
        className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 rounded-full"
        style={{
          background: '#F6B82E',
          boxShadow: '0 0 8px rgba(246,184,46,0.9)',
          animation: 'loginPulseOrb 2s ease-in-out infinite',
        }}
      />
      {/* Pulsing accent dot — bottom left */}
      <span
        className="absolute -bottom-1 -left-1 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
        style={{
          background: '#26D9A1',
          boxShadow: '0 0 6px rgba(38,217,161,0.9)',
          animation: 'loginPulseOrb 2.5s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />
    </div>

    {/* Tagline — hidden on mobile to save vertical space */}
    <div
      className="mt-4 md:mt-8 text-center login-animate-slide-up"
      style={{ animationDelay: '0.3s' }}
    >
      <h2 className="text-lg sm:text-xl md:text-3xl font-extrabold text-white mb-1 md:mb-2 tracking-tight">
        Your World of{' '}
        <span className="login-gradient-text">Languages</span>
      </h2>
      <p className="hidden sm:block text-gray-400 text-sm md:text-base max-w-xs mx-auto leading-relaxed">
        Join thousands of learners mastering new languages every day
      </p>
    </div>

    {/* Language badges — hidden on mobile, shown sm+ */}
    <div
      className="hidden sm:flex gap-2 mt-4 md:mt-5 flex-wrap justify-center login-animate-slide-up"
      style={{ animationDelay: '0.5s' }}
    >
      {LANGUAGE_BADGES.map(({ flag, lang }) => (
        <span
          key={lang}
          className="px-3 py-1 text-xs rounded-full border border-white/10 text-gray-300 transition-all duration-300 hover:border-purple-500/50 hover:text-white hover:bg-purple-500/10 cursor-default"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)' }}
        >
          {flag} {lang}
        </span>
      ))}
    </div>
  </div>
);

export default AnimatedLogo;
