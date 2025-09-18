import React, { useEffect, useState } from "react";
import { getSignedAssetUrl } from "@/entities/course/model/courseDetailsAPI";

export default function ResourceViewer({
  resource,
  course,
  token,
  presentMode = false,
  onExitPresent = () => { },
}) {
  const [signedUrl, setSignedUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!resource) {
        if (mounted) setSignedUrl(null);
        return;
      }
      try {
        const resolved = resource.publicId
          ? await getSignedAssetUrl(
            {
              publicId: resource.publicId,
              resourceType: resource.resourceType || "auto",
              type: "authenticated",
            },
            token
          )
          : await getSignedAssetUrl(
            {
              url: resource.url,
              resourceType: resource.resourceType || "auto",
              type: "authenticated",
            },
            token
          );

        const final =
          typeof resolved === "string"
            ? resolved
            : resolved?.url || resource.url;
        if (mounted) setSignedUrl(final);
      } catch (err) {
        console.warn("Signing failed, falling back to raw url", err);
        if (mounted) setSignedUrl(resource.url);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [resource?.publicId, resource?.url, resource?.resourceType, token]);

  if (!resource)
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        No preview
      </div>
    );

  const mt = (resource.mimeType || "").toLowerCase();
  const name = (resource.originalName || "").toLowerCase();
  const isPdf =
    mt === "application/pdf" ||
    name.endsWith(".pdf") ||
    ((resource.resourceType || "").startsWith("raw") &&
      name.endsWith(".pdf"));
  const isVideo = mt.startsWith("video/") || name.match(/\.(mp4|webm|mov)$/);

  if (isPdf && presentMode) {
    return (
      <div className="w-full h-full bg-black flex flex-col">
        <div
          className="flex-1 overflow-hidden"
          onContextMenu={(e) => e.preventDefault()}
        >
          <object
            data={signedUrl || resource.url}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="p-6 text-center text-slate-400">
              Preview unavailable —{" "}
              <a
                className="text-indigo-400 underline"
                href={signedUrl || resource.url}
                target="_blank"
                rel="noreferrer"
              >
                Open file
              </a>
            </div>
          </object>
        </div>
      </div>
    );
  }

  if (isVideo && presentMode) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <video
          src={signedUrl || resource.url}
          poster={course?.thumbnail || undefined}
          controls
          autoPlay
          className="w-full h-full object-contain"
          playsInline
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <object
        data={signedUrl || resource.url}
        type="application/pdf"
        className="w-full h-full"
      >
        <div className="p-6 text-center text-slate-400">
          Preview unavailable —{" "}
          <a
            className="text-indigo-400 underline"
            href={signedUrl || resource.url}
            target="_blank"
            rel="noreferrer"
          >
            Open file
          </a>
        </div>
      </object>
    );
  }

  return (
    <video
      src={signedUrl || resource.url}
      poster={course?.thumbnail || undefined}
      controls
      className="w-full h-full object-contain bg-black"
      playsInline
    />
  );
}
