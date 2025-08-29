/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud } from "react-icons/fi";
import "video-react/dist/video-react.css";
import { Player } from "video-react";
import { useLocation } from "react-router-dom";
import Button from "@/shared/components/ui/Button";

export default function Upload({
  name,
  label,
  register,
  setValue,
  errors,
  video = false,
  viewData = null,
  editData = null,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSource, setPreviewSource] = useState(viewData ?? editData ?? "");
  const inputRef = useRef(null);
  const loc = useLocation();

  // HELP popover state + ref
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef(null);
  const helpCloseBtnRef = useRef(null);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles?.[0];
    if (file) {
      previewFile(file);
      setSelectedFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: !video
      ? { "image/*": [".jpeg", ".jpg", ".png", ".webp"] }
      : { "video/*": [".mp4", ".webm", ".mov"] },
    onDrop,
    multiple: false,
  });

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPreviewSource(reader.result);
    };
  };

  useEffect(() => {
    register(name, { required: !viewData && !editData });
  }, [register, name, loc.pathname]);

  useEffect(() => {
    setValue(
      name,
      selectedFile ?? (viewData ? viewData : editData ? editData : null)
    );
  }, [selectedFile, setValue, loc.pathname]);

  const handleClear = () => {
    setPreviewSource("");
    setSelectedFile(null);
    setValue(name, null);
    if (inputRef.current) {
      // underlying dropzone input may be a FileList node
      try {
        inputRef.current.value = "";
      } catch (e) {
        /* ignore */
      }
    }
  };

  // close help on outside click or escape
  useEffect(() => {
    if (!helpOpen) return;
    const onDoc = (e) => {
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setHelpOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    // focus close button for accessibility
    setTimeout(() => helpCloseBtnRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [helpOpen]);

  // help content variables
  const acceptedFilesText = video
    ? "MP4, WEBM, MOV"
    : "JPEG, JPG, PNG, WEBP";
  const recommended =
    video ? "Recommended: MP4/WEBM • Max 200MB • 16:9 aspect" : "Recommended: 1024×576 (16:9) • WebP/JPEG";

  const errorClasses = errors?.[name] ? "border-red-500 focus:ring-red-400" : "border border-white/8";

  return (
    <div className={`flex flex-col space-y-2`}>
      <label
        className="block text-sm font-semibold text-[#0b1220]"
        htmlFor={name}
      >
        {label} {!viewData && !editData && <sup className="text-red-500"> *</sup>}
      </label>

      <div
        {...getRootProps()}
        className={` ${errorClasses} relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/6 p-4 shadow-sm transition-all
          ${isDragActive ? "ring-2 ring-offset-2 ring-[#996bec]/30" : ""}
        `}
        aria-label={label}
      >
        <input
          {...getInputProps()}
          ref={(node) => {
            inputRef.current = node ?? inputRef.current;
          }}
        />

        {/* Preview mode */}
        {previewSource ? (
          <div className="flex w-full flex-col gap-3">
            <div className="w-full overflow-hidden rounded-xl">
              {!video ? (
                <img
                  src={previewSource}
                  alt="Preview"
                  className="w-full max-h-[420px] object-cover"
                />
              ) : (
                <div className="aspect-video w-full">
                  <Player playsInline src={previewSource} fluid />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <label
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer bg-gradient-to-r from-[#7a05cf] via-[#6a00b7] to-[#7a05cf] text-white shadow"
              >
                Replace
                <input
                  type="file"
                  accept={!video ? "image/*" : "video/*"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      previewFile(f);
                      setSelectedFile(f);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {!viewData && !editData && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-full border border-white/10 bg-white/4 px-3 py-2 text-sm font-medium text-[#0b1220] hover:bg-white/8 transition"
                >
                  Remove
                </button>
              )}

              {/* Help button when preview shown */}
              <Button
                classes="text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setHelpOpen((s) => !s);
                }}
              >
                Help
              </Button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex w-full flex-col items-center justify-center gap-4 px-4 py-8 text-center">
            <div className="grid aspect-square w-14 place-items-center rounded-full bg-gradient-to-br from-[#ba7bf0]/20 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">
              <FiUploadCloud className="w-6 h-6" />
            </div>

            <div className="max-w-[540px]">
              <p className="text-sm text-[#0b1220]">
                {isDragActive
                  ? "Drop file to upload"
                  : `Drag & drop ${video ? "a video" : "an image"} here, or click to browse`}
              </p>

              <p className="mt-3 text-xs text-[#374151]">
                {video
                  ? "MP4 / WEBM recommended • Max 200MB"
                  : "Aspect ratio 16:9 • Recommended 1024×576"}
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <label className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220]">
                Browse
                <input
                  type="file"
                  accept={!video ? "image/*" : "video/*"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      previewFile(f);
                      setSelectedFile(f);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <Button
                classes="text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setHelpOpen(true);
                }}
              >
                Help
              </Button>
            </div>
          </div>
        )}

        {/* HELP POPOVER */}
        {helpOpen && (
          <div
            ref={helpRef}
            role="dialog"
            aria-modal="false"
            aria-label={`${label} upload instructions`}
            className="absolute bottom-4 right-4 top-1 z-50 min-h-72 w-80 md:w-96 rounded-lg bg-white/95 text-[#0b1220] shadow-2xl border border-[#E6E9F2] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-semibold text-sm">Upload instructions</p>
                <p className="mt-1 text-xs text-gray-600">
                  Accepted: <span className="font-medium text-gray-800">{acceptedFilesText}</span>
                </p>
              </div>
              <button
                ref={helpCloseBtnRef}
                onClick={() => setHelpOpen(false)}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/6 text-[#0b1220] hover:bg-white/8 focus:outline-none"
                aria-label="Close help"
              >
                ✕
              </button>
            </div>

            <hr className="my-3 border-t border-gray-100" />

            <div className="text-xs text-gray-700 space-y-2">
              <p className="leading-snug">{recommended}</p>

              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Use high quality images/videos for best results.</li>
                <li>Crop to 16:9 aspect ratio for consistent thumbnails.</li>
                {video && <li>Keep video length small for preview thumbnails; host large videos via CDN.</li>}
                <li>Filename should not contain special characters.</li>
                <li>Large files may take time to upload — please wait for completion.</li>
              </ul>

              <p className="mt-2 text-xs text-gray-500">
                Tip: For images prefer <strong>WebP</strong> when available for smaller size with high quality.
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setHelpOpen(false);
                }}
                className="rounded-md px-3 py-2 text-sm mb-4 font-medium bg-gray-600/6 border border-white/8 hover:bg-white/8"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {errors?.[name] && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {label} is required
        </p>
      )}
    </div>
  );
}
