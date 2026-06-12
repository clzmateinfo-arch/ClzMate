import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";

export default function HtmlViewer({ resource, token }) {
  const [htmlContent, setHtmlContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resource) {
      setHtmlContent(null);
      setError(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let url = resource.url;

        if (resource.publicId) {
          const signed = await getSignedAssetUrl(
            {
              publicId: resource.publicId,
              resourceType: resource.resourceType || "raw",
              type: "authenticated",
            },
            token
          );
          url = typeof signed === "string" ? signed : signed?.url ?? resource.url;
        }

        if (!url) throw new Error("No URL available for HTML resource");

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Failed to fetch HTML content (${resp.status})`);
        const text = await resp.text();

        if (mounted) setHtmlContent(text);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load HTML content");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [resource?.publicId, resource?.url, resource?.resourceType, token]);

  const handleDownload = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = resource?.originalName || "page.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  if (!resource) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
        No HTML content available
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
        Loading HTML page...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center flex-col gap-2 p-4 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
        No content available
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <iframe
        srcDoc={htmlContent}
        className="w-full h-full border-0"
        title={resource?.originalName || "HTML Content"}
        sandbox="allow-scripts allow-forms allow-modals"
      />
      <button
        onClick={handleDownload}
        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium transition-colors backdrop-blur-sm"
        title={`Download ${resource?.originalName || "HTML file"}`}
        type="button"
      >
        <FiDownload className="w-3.5 h-3.5" />
        Download
      </button>
    </div>
  );
}
