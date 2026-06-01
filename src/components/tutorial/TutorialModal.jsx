import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiX, FiPlay } from 'react-icons/fi';
import { updateUserSettings } from '../../redux/userSlice';

// TODO: Replace user URL when student video is ready
const TUTORIAL_URLS = {
  teacher: 'https://lingolandias-academy.s3.eu-north-1.amazonaws.com/general-videos/teachers_tutorial.mp4',
  user:    'https://lingolandias-academy.s3.eu-north-1.amazonaws.com/general-videos/student_tutorial.mp4',
};

const TutorialModal = ({ onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo?.user);

  const videoUrl = TUTORIAL_URLS[user?.role] ?? TUTORIAL_URLS.user;
  const isDirectVideo = videoUrl.endsWith('.mp4') || videoUrl.endsWith('.webm');
  const isTeacher = user?.role === 'teacher';

  const handleClose = () => {
    if (!user?.settings?.watchedTutorial) {
      dispatch(updateUserSettings({ watchedTutorial: true }));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(158,47,208,0.30)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          animation: 'navbarDropdownIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
          transformOrigin: 'center top',
        }}
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(250,245,255,0.97) 0%, rgba(243,232,255,0.97) 100%)' }}
        />
        <div
          className="hidden dark:block absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(13,10,30,0.97) 0%, rgba(26,26,46,0.97) 100%)' }}
        />
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #9E2FD0, #c084fc)', boxShadow: '0 4px 14px rgba(158,47,208,0.35)' }}
              >
                <FiPlay size={20} className="text-white ml-0.5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('tutorial.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {t(isTeacher ? 'tutorial.subtitleTeacher' : 'tutorial.subtitleStudent')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 flex-shrink-0"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Video — 16:9 */}
          <div
            className="relative w-full rounded-xl overflow-hidden"
            style={{ paddingTop: '56.25%', background: 'rgba(0,0,0,0.9)' }}
          >
            {isDirectVideo ? (
              <video
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                controls
                controlsList="nodownload"
              />
            ) : (
              <iframe
                src={videoUrl}
                className="absolute inset-0 w-full h-full"
                title={t('tutorial.title')}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-5">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #9E2FD0, #c084fc)', boxShadow: '0 4px 14px rgba(158,47,208,0.35)' }}
            >
              {t('tutorial.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
