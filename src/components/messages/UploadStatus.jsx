import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiX } from "react-icons/fi";

/**
 * Progress bar + error banner for a chat attachment upload.
 *
 * Shared by every composer (Messages, in-call chat, support) so all three
 * report failures the same way. Before this, each one caught upload errors
 * into a console.error and cleared the attachment, so a failed upload looked
 * exactly like a successful one that produced no message.
 *
 * `progress` is { name, ratio } or null; `errorCode` is an UploadError code.
 */
const UploadStatus = ({ progress, errorCode, onDismissError }) => {
  const { t } = useTranslation();

  if (!progress && !errorCode) return null;

  return (
    <div className="mb-2 px-1">
      {progress && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-[70%]">
              {t("chatWindow.uploading", { name: progress.name })}
            </span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {Math.round((progress.ratio || 0) * 100)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#9E2FD0] transition-all duration-150"
              style={{ width: `${Math.max(2, (progress.ratio || 0) * 100)}%` }}
            />
          </div>
        </>
      )}

      {errorCode && (
        <div className="flex items-start gap-2 mt-1 px-2 py-1.5 rounded-lg
                        bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <FiAlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-red-700 dark:text-red-300 flex-1">
            {t(`chatWindow.uploadError.${errorCode}`, {
              defaultValue: t("chatWindow.uploadError.upload_failed"),
            })}
          </span>
          {onDismissError && (
            <button onClick={onDismissError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-200 flex-shrink-0">
              <FiX size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadStatus;
