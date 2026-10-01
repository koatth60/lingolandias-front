// Corner cobweb with a dangling spider, shown only while the Halloween theme is on.
const HalloweenWeb = () => (
  <>
    <svg className="hw-only absolute right-0 top-0 w-[150px] h-[150px] pointer-events-none opacity-55" style={{ stroke: 'rgb(var(--ll-ink-4))', fill: 'none', strokeWidth: .8 }} viewBox="0 0 150 150" aria-hidden="true"><path d="M150 0 40 110M150 0 95 150M150 0 0 60M150 0 0 5" /><path d="M118 0c2 10 8 18 20 21 4 1 8 2 12 2M86 0c3 22 15 37 36 42 9 2 19 3 28 3M52 0c4 34 23 57 55 64 14 3 29 4 43 4M20 1c6 48 34 79 79 90 17 4 34 5 51 5" /></svg>
    <div className="hw-only hw-sm-up ll-dangle absolute right-[126px] top-0 w-5 z-[1] pointer-events-none" aria-hidden="true">
      <i className="block w-px h-24 mx-auto" style={{ background: 'linear-gradient(rgb(var(--ll-ink-4)), rgb(var(--ll-ink-3)))' }} />
      <svg className="block w-5 h-[18px] -mt-px" viewBox="0 0 20 18"><g stroke="#120A1C" strokeWidth="1.1" fill="none" strokeLinecap="round"><path d="M7 7 2 3M7 9 1 8M7 11l-5 4M8 12l-3 5M13 7l5-4M13 9l6-1M13 11l5 4M12 12l3 5" /></g><ellipse cx="10" cy="9.5" rx="3.6" ry="4.2" fill="#120A1C" /><circle cx="10" cy="4.8" r="2.2" fill="#120A1C" /><circle cx="9.2" cy="4.6" r=".5" fill="#F08A2C" /><circle cx="10.8" cy="4.6" r=".5" fill="#F08A2C" /></svg>
    </div>
  </>
);

export default HalloweenWeb;
