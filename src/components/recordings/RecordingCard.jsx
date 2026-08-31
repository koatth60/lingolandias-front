import { FiExternalLink, FiTrash2 } from "react-icons/fi";
import { formatDate, formatFilename, formatSize } from "../../utils/recordingFormat";

const RecordingCard = ({ rec, onDelete, deleting, t }) => (
  <div
    className="flex items-center justify-between gap-3 p-4 rounded-xl transition-all"
    style={{
      border: "1px solid rgba(158,47,208,0.15)",
      background: "rgba(255,255,255,0.03)",
    }}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
        style={{
          background: "linear-gradient(135deg, rgba(158,47,208,0.2), rgba(123,34,168,0.1))",
          border: "1px solid rgba(158,47,208,0.2)",
        }}
      >
        🎬
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {formatFilename(rec.filename)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(rec.lastModified)} · {formatSize(rec.size)}
          {rec.teacherName ? ` · ${rec.teacherName}` : ""}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      <a
        href={rec.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
      >
        <FiExternalLink size={12} />
        {t("recordings.view")}
      </a>
      {onDelete && (
        <button
          onClick={() => onDelete(rec.key, rec.filename)}
          disabled={deleting === rec.key}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
        >
          <FiTrash2 size={12} />
          {deleting === rec.key ? "…" : t("recordings.delete")}
        </button>
      )}
    </div>
  </div>
);

export default RecordingCard;
