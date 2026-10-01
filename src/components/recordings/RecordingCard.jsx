import { FiExternalLink, FiTrash2, FiVideo } from "react-icons/fi";
import { formatDate, formatFilename, formatSize } from "../../utils/recordingFormat";

const RecordingCard = ({ rec, onDelete, deleting, t }) => (
  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-ll-line bg-ll-panel transition-colors hover:bg-ll-subtle">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center bg-ll-violet-tint text-ll-violet-ink">
        <FiVideo size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ll-ink truncate">
          {formatFilename(rec.filename)}
        </p>
        <p className="text-[12px] text-ll-ink3 mt-0.5">
          {formatDate(rec.lastModified)} · <span className="font-mono">{formatSize(rec.size)}</span>
          {rec.teacherName ? ` · ${rec.teacherName}` : ""}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 sm:flex-shrink-0 w-full sm:w-auto">
      <a
        href={rec.url}
        target="_blank"
        rel="noopener noreferrer"
        className="ll-btn ll-btn-primary ll-btn-sm"
      >
        <FiExternalLink size={13} />
        {t("recordings.view")}
      </a>
      {onDelete && (
        <button
          onClick={() => onDelete(rec.key, rec.filename)}
          disabled={deleting === rec.key}
          className="ll-btn ll-btn-secondary ll-btn-sm !text-ll-danger disabled:opacity-40"
        >
          <FiTrash2 size={13} />
          {deleting === rec.key ? "…" : t("recordings.delete")}
        </button>
      )}
    </div>
  </div>
);

export default RecordingCard;
