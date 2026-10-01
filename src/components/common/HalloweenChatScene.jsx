import PropTypes from "prop-types";

// Chat backdrop for the Halloween theme: moonlit graveyard behind the messages.
// Sits under the conversation (pointer-events: none) and stays low-contrast so
// bubbles keep their legibility.
const BAT_PATH = "M20 5.5c.8-1.6 1.6-2.3 2.2-2.3.2.9.1 1.6-.3 2.2 2.6-.4 5.9-2.3 8.4-5.4.3 2.6 2.9 4.9 9.7 5.2-3.4 1-5.9 3.5-6.4 7.6-1.7-1.9-4.4-2.4-6.2-1-1.3-1.9-3.6-2.8-5.3-1.3-.8-.6-1.5-.6-2.2 0-1.7-1.5-4-.6-5.3 1.3-1.8-1.4-4.5-.9-6.2 1C7.9 8.7 5.4 6.2 2 5.2 8.8 4.9 11.4 2.6 11.7 0c2.5 3.1 5.8 5 8.4 5.4-.4-.6-.5-1.3-.3-2.2.6 0 1.4.7 2.2 2.3";

const HalloweenChatScene = ({ gyBottom = "bottom-14", fogBottom = "bottom-12", moonTop = "top-14", gyHeight = "h-48", calm = false }) => (
  <div className="hw-only absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {/* stars */}
    <div
      className="absolute inset-0 opacity-70"
      style={{
        backgroundImage: 'radial-gradient(1.3px 1.3px at 14px 22px,rgba(255,255,255,.55) 50%,transparent 60%),radial-gradient(1px 1px at 96px 64px,rgba(255,255,255,.35) 50%,transparent 60%),radial-gradient(1.6px 1.6px at 152px 138px,rgba(255,214,150,.55) 50%,transparent 60%),radial-gradient(1px 1px at 44px 160px,rgba(255,255,255,.3) 50%,transparent 60%),radial-gradient(1.2px 1.2px at 128px 12px,rgba(255,255,255,.4) 50%,transparent 60%)',
        backgroundSize: '180px 180px',
        maskImage: 'linear-gradient(to bottom, #000 0%, transparent 70%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, transparent 70%)',
      }}
    />
    {/* moon */}
    {!calm && (
    <div
      className={`absolute ${moonTop} right-[8%] w-24 h-24 rounded-full opacity-60`}
      style={{ background: 'radial-gradient(circle at 38% 35%,#FFF6E0 0%,#FFE3A8 42%,#F2C46A 78%,#D9A24A 100%)', boxShadow: '0 0 60px 10px rgba(245,196,81,.2),0 0 160px 40px rgba(240,138,44,.1)' }}
    >
      <span className="absolute rounded-full" style={{ width: '20%', height: '20%', left: '52%', top: '23%', background: 'rgba(170,110,40,.22)' }} />
      <span className="absolute rounded-full" style={{ width: '12%', height: '12%', left: '27%', top: '59%', background: 'rgba(170,110,40,.22)', boxShadow: '30px 6px 0 -3px rgba(170,110,40,.2)' }} />
    </div>
    )}
    {/* bats */}
    {!calm && (
    <svg className="absolute top-20 left-[14%] w-[170px] h-[70px]" style={{ fill: 'rgb(var(--ll-ink-4))', opacity: .35 }} viewBox="0 0 170 70">
      {[[10, 30, 40, 16], [70, 8, 28, 11], [118, 44, 22, 9]].map(([x, y, w, h]) => (
        <svg key={x} x={x} y={y} width={w} height={h} viewBox="0 0 40 16"><path className="ll-bob" d={BAT_PATH} /></svg>
      ))}
    </svg>
    )}
    {/* fog */}
    <div
      className={`ll-fog absolute -left-[10%] -right-[10%] ${fogBottom} h-32`}
      style={{ background: 'radial-gradient(50% 60% at 25% 100%,rgba(200,185,255,.14),transparent 70%),radial-gradient(45% 60% at 78% 100%,rgba(200,185,255,.1),transparent 70%)' }}
    />
    {/* graveyard */}
    <svg className={`absolute left-0 right-0 ${gyBottom} w-full ${gyHeight} ${calm ? "opacity-60" : ""}`} viewBox="0 0 800 160" preserveAspectRatio="xMidYMax slice">
      <path d="M0 118c120-22 260-10 400-14s280-20 400-6v62H0z" fill="#1A1226" />
      <g fill="#241A33">
        <path d="M60 118V88a16 16 0 0 1 32 0v30z" /><path d="M118 122V104a11 11 0 0 1 22 0v18z" />
        <path d="M250 112V92a13 13 0 0 1 26 0v20z" /><path d="M520 108V90a14 14 0 0 1 28 0v18z" />
        <path d="M600 112V98a10 10 0 0 1 20 0v14z" /><path d="M700 108V84a15 15 0 0 1 30 0v24z" />
      </g>
      <g stroke="#3A2D4C" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M68 94h16M76 86v20" /><path d="M259 98h8M263 92v12" /><path d="M708 90h14M715 83v18" />
      </g>
      <g stroke="#241A33" strokeLinecap="round" fill="none">
        <path d="M168 118V70M156 84h24" strokeWidth="6" />
        {!calm && (<>
        <path d="M390 108C392 82 384 62 392 30" strokeWidth="9" />
        <path d="M391 64c13-8 24-10 38-24M391 76c-13-8-24-14-34-32M392 44c8-8 9-16 16-24M429 40c5 0 10 3 14 0M357 44c-5-1-9 1-13 0" strokeWidth="4" />
        </>)}
      </g>
      {/* iron fence */}
      <g stroke="#241A33" strokeWidth="2.5" strokeLinecap="round">
        <path d="M440 112h120" />
        {[446, 458, 470, 482, 494, 506, 518, 530, 542, 554].map((x) => <path key={x} d={`M${x} 112V92`} />)}
      </g>
      {!calm && (<>
      {/* jack-o'-lantern */}
      <ellipse cx="320" cy="112" rx="16" ry="12" fill="#F08A2C" />
      <path d="M320 101c0-3 2-5 4-6" stroke="#3CCB8F" strokeWidth="2" fill="none" />
      <g className="ll-flicker" fill="#FFE08A">
        <path d="M311 111l3.5-5 3.5 5zM322 111l3.5-5 3.5 5z" /><path d="M311 116c4 3.5 12 3.5 18 0l-2.5 1-2-2.5-2.5 2.5-2.5-2.5-2 2.5z" />
      </g>
      </>)}
    </svg>
  </div>
);

HalloweenChatScene.propTypes = {
  gyBottom: PropTypes.string,
  fogBottom: PropTypes.string,
  moonTop: PropTypes.string,
  gyHeight: PropTypes.string,
  calm: PropTypes.bool,
};

export default HalloweenChatScene;
