import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud } from "react-icons/fi";
import "video-react/dist/video-react.css";
import { Player } from "video-react";

export default function Upload({
  name,
  label,
  register,
  setValue,
  errors,
  fileType = "image",
  viewData = null,
  editData = null,
  required = true,
  previewHeight = 420,
  multiple = false,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewSource, setPreviewSource] = useState(viewData ?? editData ?? "");
  const inputRef = useRef(null);

  // create accept map
  const acceptMap = {
    image: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    video: { "video/*": [".mp4", ".webm", ".mov"] },
    pdf: { "application/pdf": [".pdf"] },
    any: {},
  };

  const onDrop = (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    if (multiple) {
      const newFiles = [...selectedFiles, ...acceptedFiles];
      setSelectedFiles(newFiles);
      setValue(name, newFiles);
      setPreview(acceptedFiles[0]);
    } else {
      const file = acceptedFiles[0];
      setSelectedFiles([file]);
      setValue(name, file);
      setPreview(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptMap[fileType] ?? {},
    onDrop,
    multiple,
  });

  const setPreview = (file) => {
    if (!file) return setPreviewSource("");
    if (previewSource && previewSource.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewSource);
      } catch (e) { }
    }
    const url = URL.createObjectURL(file);
    setPreviewSource(url);
  };

  useEffect(() => {
    register(name, { required: required && !viewData && !editData });
  }, [register, name, viewData, editData, required]);

  useEffect(() => {
    if (!selectedFiles.length) {
      setPreviewSource(viewData ?? editData ?? "");
      setValue(name, viewData ?? editData ?? null);
    }
    return () => {
      if (previewSource && previewSource.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewSource);
        } catch (e) { }
      }
    };
  }, [viewData, editData]);

  const handleClear = () => {
    if (previewSource && previewSource.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewSource);
      } catch (e) { }
    }
    setPreviewSource("");
    setSelectedFiles([]);
    setValue(name, multiple ? [] : null);
    if (inputRef.current) {
      try {
        inputRef.current.value = "";
      } catch (e) { }
    }
  };

  const acceptedFilesText = fileType === "video" ? "MP4, WEBM, MOV" : fileType === "pdf" ? "PDF" : fileType === "image" ? "JPEG, JPG, PNG, WEBP" : "Any";
  const recommended = fileType === "video" ? "Recommended: MP4/WEBM • Max 200MB • 16:9 aspect" : fileType === "image" ? "Recommended: 1024×576 (16:9) • WebP/JPEG" : "PDF slides or notes";
  const errorClasses = errors?.[name] ? "border-red-500 focus:ring-red-400" : "border border-white/8";

  return (
    <div className={`flex flex-col space-y-2`}>
      <label className="block text-sm font-semibold text-[#0b1220]" htmlFor={name}>
        {label}
        {!viewData && !editData && required && <sup className="text-red-500"> *</sup>}
      </label>

      <div
        {...getRootProps()}
        className={`relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/6 p-4 shadow-sm transition-all ${errorClasses} ${isDragActive ? "ring-2 ring-offset-2 ring-[#996bec]/30" : ""}`}
        aria-label={label}
      >
        <input
          {...getInputProps()}
          ref={(node) => {
            inputRef.current = node ?? inputRef.current;
          }}
        />

        {previewSource ? (
          <div className="flex w-full flex-col gap-3">
            <div className="w-full overflow-hidden rounded-xl">
              {fileType === "image" ? (
                <img src={previewSource} alt="Preview" className="w-full object-cover" style={{ maxHeight: previewHeight }} />
              ) : fileType === "video" ? (
                <div style={{ height: previewHeight }} className="w-full overflow-hidden rounded-xl">
                  <Player playsInline src={previewSource} fluid={false} width="100%" height={previewHeight} />
                </div>
              ) : fileType === "pdf" ? (
                <div style={{ height: previewHeight }} className="w-full overflow-auto rounded-xl bg-white">
                  <object data={previewSource} type="application/pdf" className="w-full h-full">
                    <p className="p-4">PDF preview not available. <a href={previewSource} target="_blank" rel="noreferrer" className="underline">Open</a></p>
                  </object>
                </div>
              ) : (
                <div className="p-4"> <a href={previewSource} target="_blank" rel="noreferrer" className="underline">Open file</a> </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end">
              <label className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold cursor-pointer bg-gradient-to-r from-[#7a05cf] via-[#6a00b7] to-[#7a05cf] text-white shadow">
                Replace
                <input
                  type="file"
                  accept={fileType === "video" ? "video/*" : fileType === "pdf" ? "application/pdf" : fileType === "image" ? "image/*" : undefined}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFiles([f]);
                      setValue(name, multiple ? [f] : f);
                      setPreview(f);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {!viewData && !editData && (
                <button type="button" onClick={handleClear} className="rounded-full border border-white/10 bg-white/4 px-3 py-2 text-sm font-medium text-[#0b1220] hover:bg-white/8 transition">
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-4 px-4 py-8 text-center">
            <div className="grid aspect-square w-14 place-items-center rounded-full bg-gradient-to-br from-[#ba7bf0]/20 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">
              <FiUploadCloud className="w-6 h-6" />
            </div>
            <div className="max-w-[540px]">
              <p className="text-sm text-[#0b1220]">{isDragActive ? "Drop file to upload" : `Drag & drop ${fileType === "video" ? "a video" : fileType === "pdf" ? "a PDF" : fileType === "image" ? "an image" : "a file"} here, or click to browse`}</p>
              <p className="mt-3 text-xs text-[#374151]">{recommended}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <label className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220]">
                Browse
                <input
                  type="file"
                  accept={fileType === "video" ? "video/*" : fileType === "pdf" ? "application/pdf" : fileType === "image" ? "image/*" : undefined}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFiles([f]);
                      setValue(name, multiple ? [f] : f);
                      setPreview(f);
                    }
                  }}
                  className="hidden"
                />
              </label>
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

