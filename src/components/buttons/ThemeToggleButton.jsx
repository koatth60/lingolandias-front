// buttons/ThemeToggleButton.jsx
import { FiSun, FiMoon } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings } from '../../redux/userSlice';
import { useHalloween } from '../../context/HalloweenContext';

// Drawn to match react-icons/fi's stroke weight and viewBox — a pumpkin has
// no Feather-icon equivalent, so this fills the same slot as FiSun/FiMoon.
const PumpkinIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 7.5c-4.6 0-7.5 2.8-7.5 6.3S7.4 20 12 20s7.5-2.7 7.5-6.2S16.6 7.5 12 7.5z" />
    <path d="M12 7.5V5c0-.9.7-1.8 1.8-2" />
  </svg>
);

const ThemeToggleButton = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo.user);
  const { enabled: halloween } = useHalloween();

  // Single source of truth: Redux state (same one App.jsx reads to apply the 'dark' class)
  const isDark = user?.settings?.darkMode ?? false;

  const toggleTheme = () => {
    const newTheme = !isDark;
    dispatch(updateUserSettings({ darkMode: newTheme }));
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      disabled={halloween}
      title={halloween ? 'Halloween theme is on — turn it off in Settings to switch' : undefined}
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                 bg-ll-hover text-ll-ink2
                 hover:bg-ll-line2 hover:text-ll-ink
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-colors duration-150"
      aria-label="Toggle theme"
    >
      {halloween ? <PumpkinIcon /> : (isDark ? <FiSun size={16} /> : <FiMoon size={16} />)}
    </button>
  );
};

export default ThemeToggleButton;
