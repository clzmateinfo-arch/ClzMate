import { useEffect, useState } from "react";
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
    <iframe
      srcDoc={htmlContent}
      className="w-full h-full border-0"
      title={resource?.originalName || "HTML Content"}
      sandbox="allow-scripts allow-forms allow-modals"
    />
  );
}
