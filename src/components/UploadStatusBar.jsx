import { useUpload } from "../context/UploadContext";

const UploadStatusBar = () => {
  const { uploads } = useUpload();
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-2xl"
          style={{
            backdropFilter: "blur(10px)",
            background:
              upload.status === "done"
                ? "rgba(38,217,161,0.92)"
                : upload.status === "error"
                ? "rgba(239,68,68,0.92)"
                : "rgba(13,10,30,0.90)",
            border:
              "1px solid " +
              (upload.status === "done"
                ? "rgba(38,217,161,0.4)"
                : upload.status === "error"
                ? "rgba(239,68,68,0.4)"
                : "rgba(158,47,208,0.35)"),
            boxShadow:
              upload.status === "uploading"
                ? "0 4px 24px rgba(158,47,208,0.25)"
                : "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          {upload.status === "uploading" && (
            <>
              <span
                className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white flex-shrink-0"
                style={{ animation: "spin 0.8s linear infinite" }}
              />
              <span className="truncate max-w-[200px]">{upload.filename}</span>
              <span className="text-[10px] opacity-60 whitespace-nowrap">
                · Don't close this tab
              </span>
            </>
          )}
          {upload.status === "done" && (
            <>
              <span>✓</span>
              <span className="truncate max-w-[220px]">
                {upload.filename} saved!
              </span>
            </>
          )}
          {upload.status === "error" && (
            <>
              <span>✕</span>
              <span className="truncate max-w-[220px]">
                Failed: {upload.filename}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default UploadStatusBar;
