// Full-bleed Halloween backdrop for auth screens: moon, bats, graveyard and fog.
// Rendered only while the theme is on (the .hw-only helper hides it otherwise).
const BAT_PATH = "M20 5.5c.8-1.6 1.6-2.3 2.2-2.3.2.9.1 1.6-.3 2.2 2.6-.4 5.9-2.3 8.4-5.4.3 2.6 2.9 4.9 9.7 5.2-3.4 1-5.9 3.5-6.4 7.6-1.7-1.9-4.4-2.4-6.2-1-1.3-1.9-3.6-2.8-5.3-1.3-.8-.6-1.5-.6-2.2 0-1.7-1.5-4-.6-5.3 1.3-1.8-1.4-4.5-.9-6.2 1C7.9 8.7 5.4 6.2 2 5.2 8.8 4.9 11.4 2.6 11.7 0c2.5 3.1 5.8 5 8.4 5.4-.4-.6-.5-1.3-.3-2.2.6 0 1.4.7 2.2 2.3";

const HalloweenScenery = () => (
  <div className="hw-only absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    <div
      className="absolute top-[7%] right-[9%] w-24 h-24 sm:w-32 sm:h-32 rounded-full"
      style={{ background: 'radial-gradient(circle at 38% 35%,#FFF6E0 0%,#FFE3A8 42%,#F2C46A 78%,#D9A24A 100%)', boxShadow: '0 0 60px 10px rgba(245,196,81,.25),0 0 180px 50px rgba(240,138,44,.12)' }}
    >
      <span className="absolute rounded-full" style={{ width: '20%', height: '20%', left: '52%', top: '23%', background: 'rgba(170,110,40,.22)' }} />
      <span className="absolute rounded-full" style={{ width: '12%', height: '12%', left: '27%', top: '59%', background: 'rgba(170,110,40,.22)', boxShadow: '36px 7px 0 -3px rgba(170,110,40,.2)' }} />
    </div>

    <svg className="absolute left-[12%] top-[10%] w-[170px] h-[70px]" style={{ fill: '#0B0612', opacity: .9 }} viewBox="0 0 170 70">
      {[[10, 30, 40, 16], [70, 8, 28, 11], [118, 44, 22, 9]].map(([x, y, w, h]) => (
        <svg key={x} x={x} y={y} width={w} height={h} viewBox="0 0 40 16"><path className="ll-bob" d={BAT_PATH} /></svg>
      ))}
    </svg>

    <div
      className="ll-fog absolute -left-[10%] -right-[10%] bottom-0 h-28"
      style={{ background: 'radial-gradient(50% 60% at 30% 100%,rgba(200,185,255,.22),transparent 70%),radial-gradient(45% 60% at 80% 100%,rgba(200,185,255,.16),transparent 70%)' }}
    />
    <svg className="absolute left-0 right-0 bottom-0 w-full h-52" viewBox="0 0 660 96" preserveAspectRatio="xMidYMax slice">
      <path d="M0 74c110-20 220-8 330-12s220-18 330-6v40H0z" fill="#0A0612" />
      <path d="M16 62h120" stroke="#0A0612" strokeWidth="3" />
      <g fill="#0A0612">
        <path d="M22 76V54l3-5 3 5v22zM42 76V54l3-5 3 5v22zM62 76V54l3-5 3 5v22zM82 76V54l3-5 3 5v22zM102 76V54l3-5 3 5v22zM122 76V54l3-5 3 5v22z" />
        <path d="M232 70V50a12 12 0 0 1 24 0v20z" /><path d="M272 70V58a8 8 0 0 1 16 0v12z" /><path d="M396 66V52a9 9 0 0 1 18 0v14z" />
        <path d="M470 70V56a10 10 0 0 1 20 0v14zM560 68V52a11 11 0 0 1 22 0v16z" />
      </g>
      <path d="M300 66V40M290 49h20" stroke="#0A0612" strokeWidth="5" strokeLinecap="round" />
      <g stroke="#0A0612" strokeLinecap="round" fill="none">
        <path d="M340 66C342 48 336 34 342 12" strokeWidth="7" />
        <path d="M341 36c10-6 18-8 28-18M341 44c-10-6-18-10-26-20M342 24c6-6 7-12 12-18M369 18c4 0 8 2 11 0M315 24c-4-1-7 1-10 0" strokeWidth="3" />
      </g>
      <ellipse cx="520" cy="64" rx="9" ry="7" fill="#F08A2C" />
      <path d="M520 57c0-2 1-3 2.5-3.5" stroke="#3CCB8F" strokeWidth="1.6" fill="none" />
      <path className="ll-flicker" d="M515.5 63l2-2.5 2 2.5zM520.5 63l2-2.5 2 2.5zM516 66c2.5 2 5.5 2 8 0" fill="#FFE08A" stroke="#FFE08A" strokeWidth=".8" />
    </svg>
  </div>
);

export default HalloweenScenery;
