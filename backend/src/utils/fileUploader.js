// src/utils/fileUploader.js
const cloudinary = require("cloudinary").v2;
const { extractPublicIdFromUrl } = require("./cloudinaryId");

/**
 * Upload file to Cloudinary as authenticated asset (private).
 * file: express-fileupload file (tempFilePath, mimetype, name, size)
 */
exports.uploadFileToCloudinary = async (file, folder, height, quality, opts = {}) => {
  try {
    const options = { folder };

    if (height) options.height = height;
    if (quality) options.quality = quality;

    // Let Cloudinary decide resource type automatically
    options.resource_type = "auto";
    // make asset authenticated (private, requires signed URLs)
    options.type = "authenticated";

    if (opts.extraOptions && typeof opts.extraOptions === "object") {
      Object.assign(options, opts.extraOptions);
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, options);
    // result contains secure_url, public_id, resource_type, duration, etc.
    return result;
  } catch (error) {
    console.error("Error while uploading file to Cloudinary", error);
    throw error;
  }
};

/**
 * Delete resource from Cloudinary given a public_id OR a full URL.
 * If URL is provided, we will derive its public_id.
 */
exports.deleteResourceFromCloudinary = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return;
  try {
    let publicId = null;
    if (typeof publicIdOrUrl !== "string") {
      publicId = null;
    } else {
      // if input is already a short public id without http(s)
      if (!publicIdOrUrl.startsWith("http")) {
        publicId = publicIdOrUrl;
      } else {
        // try to extract
        publicId = extractPublicIdFromUrl(publicIdOrUrl);
      }
    }

    if (!publicId) {
      // fallback: attempt to call destroy using the input (Cloudinary will try to resolve)
      return await cloudinary.uploader.destroy(publicIdOrUrl, { resource_type: "auto", type: "authenticated" });
    }

    return await cloudinary.uploader.destroy(publicId, { resource_type: "auto", type: "authenticated" });
  } catch (err) {
    console.error("Error deleting resource from Cloudinary:", err);
    throw err;
  }
};
