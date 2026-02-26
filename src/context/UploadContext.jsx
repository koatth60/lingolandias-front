import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const UploadContext = createContext(null);

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]); // [{ id, filename, status }]

  const activeCount = uploads.filter((u) => u.status === "uploading").length;

  // Block tab/browser close while any upload is in progress
  useEffect(() => {
    if (activeCount === 0) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue =
        "A recording is still uploading. Closing this tab will lose the recording.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [activeCount]);

  /**
   * Start a background upload. Returns immediately — the upload runs async
   * independently of whichever component triggered it.
   */
  const startUpload = useCallback((formData, filename) => {
    const id = Date.now();
    setUploads((prev) => [...prev, { id, filename, status: "uploading" }]);

    (async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/upload/recording`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Server error");

        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "done" } : u))
        );
        setTimeout(
          () => setUploads((prev) => prev.filter((u) => u.id !== id)),
          6000
        );
      } catch (err) {
        console.error("Recording upload failed:", err);
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "error" } : u))
        );
        setTimeout(
          () => setUploads((prev) => prev.filter((u) => u.id !== id)),
          10000
        );
      }
    })();
  }, []);

  return (
    <UploadContext.Provider value={{ uploads, startUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
