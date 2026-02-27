import { useState, useRef } from "react";
import PropTypes from "prop-types";
import { FiCamera, FiUpload, FiX, FiCheck } from "react-icons/fi";

const Modal = ({ isOpen, onClose, onSave }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleInputChange = (e) => handleFileChange(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleSave = () => {
    if (file) {
      onSave(file);
      reset();
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) reset(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(158,47,208,0.25)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(158,47,208,0.15)",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

        {/* Glass background */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ background: "rgba(15,12,38,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        />

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 3px 10px rgba(158,47,208,0.4)" }}
              >
                <FiCamera size={15} className="text-white" />
              </div>
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">
                Upload Photo
              </h2>
            </div>
            <button
              onClick={reset}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              style={{ background: "rgba(158,47,208,0.07)", border: "1px solid rgba(158,47,208,0.15)" }}
            >
              <FiX size={14} />
            </button>
          </div>

          {/* Drop zone / preview */}
          <div
            onClick={() => !preview && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center mb-5 transition-all duration-200"
            style={{
              height: "180px",
              border: `2px dashed ${dragging ? "#9E2FD0" : preview ? "rgba(38,217,161,0.45)" : "rgba(158,47,208,0.25)"}`,
              background: dragging
                ? "rgba(158,47,208,0.06)"
                : preview
                ? "transparent"
                : "rgba(158,47,208,0.03)",
              cursor: preview ? "default" : "pointer",
            }}
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                {/* Change overlay */}
                <button
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
                >
                  <FiUpload size={22} className="text-white" />
                  <span className="text-white text-xs font-semibold">Change photo</span>
                </button>
              </>
            ) : (
              <>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(158,47,208,0.10)", border: "1px solid rgba(158,47,208,0.20)" }}
                >
                  <FiUpload size={22} style={{ color: "#9E2FD0" }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {dragging ? "Drop it here!" : "Click or drag to upload"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  JPG, PNG, GIF — max 5 MB
                </p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80"
              style={{
                background: "rgba(158,47,208,0.08)",
                border: "1px solid rgba(158,47,208,0.20)",
                color: "#9E2FD0",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!file}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: file
                  ? "linear-gradient(135deg, #26D9A1, #1fa07a)"
                  : "rgba(38,217,161,0.3)",
                boxShadow: file ? "0 4px 16px rgba(38,217,161,0.35)" : "none",
              }}
            >
              <FiCheck size={15} />
              Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default Modal;
