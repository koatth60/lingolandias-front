// buttons/ThemeToggleButton.jsx
import { FiSun, FiMoon } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings } from '../../redux/userSlice';

const ThemeToggleButton = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo.user);

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
      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center
                 bg-gray-800 dark:bg-white/10
                 text-white dark:text-gray-300
                 hover:bg-gray-700 dark:hover:bg-white/20
                 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
    </button>
  );
};

export default ThemeToggleButton;
