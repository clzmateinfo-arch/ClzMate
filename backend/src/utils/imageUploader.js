const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    try {
        const options = { folder };
        if (height) options.height = height;
        if (quality) options.quality = quality;
        options.resource_type = "auto";
        // cloudinary uploader returns { public_id, secure_url, duration, ... }
        const result = await cloudinary.uploader.upload(file.tempFilePath, options);
        return result;
    } catch (error) {
        console.log("Error while uploading file to cloudinary", error);
        throw error;
    }
};

exports.deleteResourceFromCloudinary = async (publicIdOrUrl) => {
  if (!publicIdOrUrl) return;
  try {
    const publicId = publicIdOrUrl.includes("http") ? undefined : publicIdOrUrl;
    if (publicId) {
      return await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    } else {
      try {
        const parts = publicIdOrUrl.split("/");
        const last = parts[parts.length - 1];
        const id = last.split(".")[0];
        return await cloudinary.uploader.destroy(id, { resource_type: "auto" });
      } catch (e) {
        return await cloudinary.uploader.destroy(publicIdOrUrl, { resource_type: "auto" });
      }
    }
  } catch (err) {
    console.error("Error deleting resource from Cloudinary:", err);
    throw err;
  }
};
