// src/shared/components/ui/Upload.jsx
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud } from "react-icons/fi";

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
  disabled = false,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewSource, setPreviewSource] = useState(viewData ?? editData ?? "");
  const inputRef = useRef(null);

  const acceptMap = {
    image: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    video: { "video/*": [".mp4", ".webm", ".mov"] },
    pdf: { "application/pdf": [".pdf"] },
    any: { "image/*": [], "video/*": [], "application/pdf": [], ".zip": [] },
  };

  const isFileAllowed = (file, expectedType) => {
    if (!file) return false;
    const mimetype = (file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    const ext = name.includes(".") ? name.substring(name.lastIndexOf(".")) : "";

    if (expectedType === "video") return mimetype.includes("video");
    if (expectedType === "pdf") return mimetype.includes("pdf");
    if (expectedType === "image") return mimetype.includes("image");

    if (mimetype.includes("image/")) return true;
    if (mimetype.startsWith("video/")) return true;
    if (mimetype === "application/pdf" || ext === ".pdf") return true;
    if (ext === ".zip" || mimetype === "application/zip") return true;
    return false;
  };

  const onDrop = (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = multiple ? acceptedFiles : acceptedFiles[0];

    if (multiple && Array.isArray(file)) {
      const filtered = file.filter((f) => isFileAllowed(f, fileType));
      if (filtered.length !== file.length) {
        window.alert("Some files were rejected — only images, videos, PDFs and ZIPs are allowed.");
      }
      const newFiles = [...selectedFiles, ...filtered];
      setSelectedFiles(newFiles);
      setValue(name, newFiles);
      if (filtered[0]) setPreview(filtered[0]);
      return;
    }

    const f = file;
    if (!isFileAllowed(f, fileType)) {
      window.alert(
        fileType === "video"
          ? "Please upload a valid video file (MP4/WEBM/MOV)."
          : fileType === "pdf"
            ? "Please upload a valid PDF file."
            : "File type not allowed. Allowed: images, videos, PDF, ZIP."
      );
      return;
    }

    if (multiple) {
      const newFiles = [...selectedFiles, f];
      setSelectedFiles(newFiles);
      setValue(name, newFiles);
      setPreview(f);
    } else {
      setSelectedFiles([f]);
      setValue(name, f);
      setPreview(f);
    }
  };

  // useDropzone provides input props; we also keep a ref so manual buttons can call click()
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptMap[fileType] ?? acceptMap.any,
    onDrop,
    multiple,
  });

  // We must ensure the input's ref is accessible: use a callback ref that captures getInputProps() node
  const inputProps = getInputProps();
  const inputRefSetter = (node) => {
    // assign the file input node to our local ref so manual buttons can trigger click()
    inputRef.current = node ?? inputRef.current;
    // also call any existing ref function returned by getInputProps()
    if (typeof inputProps.ref === "function") inputProps.ref(node);
  };

  const setPreview = (file) => {
    if (!file) return setPreviewSource("");
    if (previewSource && previewSource.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewSource);
      } catch (e) { }
    }
    const url = typeof file === "string" ? file : URL.createObjectURL(file);
    setPreviewSource(url);
  };

  useEffect(() => {
    // register with react-hook-form. This mirrors previous behavior:
    register(name, { required: required && !viewData && !editData });
    // ensure form value is set to existing view/edit data if any
    if (!selectedFiles.length) {
      setPreviewSource(viewData ?? editData ?? "");
      setValue(name, viewData ?? editData ?? null);
    }
    // clean up blob URLs on unmount
    return () => {
      if (previewSource && previewSource.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(previewSource);
        } catch (e) { }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // helper to trigger native file dialog
  const openFileDialog = () => {
    if (inputRef.current && typeof inputRef.current.click === "function") {
      inputRef.current.click();
    }
  };

  return (
    <div className={`flex flex-col space-y-2`}>
      <label className="block text-sm font-semibold text-[#0b1220]" htmlFor={name}>
        {label}
        {!viewData && !editData && required && <sup className="text-red-500"> *</sup>}
      </label>

      <div
        {...getRootProps()}
        className={`relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/6 p-4 shadow-sm transition-all ${isDragActive ? "ring-2 ring-offset-2 ring-[#996bec]/30" : ""}`}
        aria-label={label}
      >
        {/* primary dropzone input (from react-dropzone) */}
        <input
          {...inputProps}
          ref={inputRefSetter}
        />

        {previewSource ? (
          <div className="flex w-full flex-col gap-3">
            <div className="w-full overflow-hidden rounded-xl">
              {fileType === "image" ? (
                <img src={previewSource} alt="Preview" className="w-full object-cover" style={{ maxHeight: previewHeight }} />
              ) : fileType === "video" ? (
                <div style={{ height: previewHeight }} className="w-full overflow-hidden rounded-xl bg-black">
                  <video
                    src={previewSource}
                    controls
                    playsInline
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
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
              {/* show Replace when NOT disabled */}
              {!disabled && (
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#7a05cf] via-[#6a00b7] to-[#7a05cf] text-white shadow"
                >
                  Replace
                </button>
              )}

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
              <p className="mt-3 text-xs text-[#374151]">{fileType === "video" ? "Recommended: MP4/WEBM • Max 200MB • 16:9 aspect" : fileType === "image" ? "Recommended: 1024×576 (16:9) • WebP/JPEG" : "PDF slides or notes"}</p>
            </div>
            <div className="mt-4 flex gap-3">
              {/* show Browse when NOT disabled */}
              {!disabled && (
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-amber-400/90 border border-white/8 text-[#0b1220]"
                >
                  Browse
                </button>
              )}
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
