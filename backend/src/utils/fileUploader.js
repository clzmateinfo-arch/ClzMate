const cloudinary = require("cloudinary").v2;
const path = require("path");

function detectResourceTypeFromFile(file) {
  if (!file) return "raw";

  const mimetype = (file.mimetype || "").toLowerCase();
  const ext = (file.name && path.extname(file.name).toLowerCase()) || "";

  if (mimetype.includes("image")) return "image";
  if (mimetype.includes("video")) return "video";
  return "auto";
}

exports.uploadFileToCloudinary = async (file, folder, height, quality, opts = {}) => {
  try {
    if (!file) throw new Error("No file provided to uploadFileToCloudinary");

    const resource_type = opts.resource_type || detectResourceTypeFromFile(file);

    const options = {
      folder,
      resource_type,
      type: "authenticated",
    };

    if (resource_type === "image" || resource_type === "video") {
      const transformation = {};
      if (height) transformation.height = height;
      if (quality) transformation.quality = quality;
      if (Object.keys(transformation).length) options.transformation = [transformation];
    }

    if (opts.extraOptions && typeof opts.extraOptions === "object") {
      Object.assign(options, opts.extraOptions);
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, options);

    result._resource_type = resource_type;

    return result;
  } catch (err) {
    console.error("Error while uploading file to Cloudinary", err);
    throw err;
  }
};

exports.deleteResourceFromCloudinary = async (publicIdOrUrl, resourceType = null) => {
  if (!publicIdOrUrl) return;
  try {
    let publicId = publicIdOrUrl;

    if (typeof publicIdOrUrl === "string" && publicIdOrUrl.startsWith("http")) {
      try {
        const u = new URL(publicIdOrUrl);
        const parts = u.pathname.split("/").filter(Boolean);
        const uploadIdx = parts.findIndex((p) => p === "upload");
        if (uploadIdx !== -1) {
          const maybeType = parts[uploadIdx - 1];
          if (["image", "video", "raw"].includes(maybeType)) resourceType = resourceType || maybeType;
          const after = parts.slice(uploadIdx + 1).filter((seg) => !/^v\d+$/.test(seg));
          const last = after.pop();
          const filename = last && last.includes(".") ? last.substring(0, last.lastIndexOf(".")) : last;
          const folder = after.length ? after.join("/") + "/" : "";
          publicId = `${folder}${filename}`;
        }
      } catch (e) {
        console.error("Error parsing URL:", e.message);
      }
    }

    if (resourceType) {
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: "authenticated" });
    }

    const tryTypes = ["video", "image", "raw"];
    for (const rt of tryTypes) {
      try {
        const res = await cloudinary.uploader.destroy(publicId, { resource_type: rt, type: "authenticated" });
        return res;
      } catch (e) {
        console.warn(`destroy with resource_type=${rt} failed:`, e.message || e);
      }
    }

    return await cloudinary.uploader.destroy(publicId, { resource_type: "raw", type: "authenticated" });
  } catch (err) {
    console.error("Error deleting resource from Cloudinary:", err && err.message ? err.message : err);
    throw err;
  }
};
