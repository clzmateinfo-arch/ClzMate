const cloudinary = require("cloudinary").v2;
const { extractPublicIdAndResourceType } = require("../utils/cloudinaryId");

exports.getAssetUrl = async (req, res) => {
  try {
    const { url, publicId: providedPublicId, resourceType: providedResourceType, expiresInSec = 300 } = req.body;

    let publicId = providedPublicId || null;
    let resourceType = providedResourceType || null;

    if (!publicId && url) {
      const extracted = extractPublicIdAndResourceType(url);
      publicId = extracted.publicId;
      resourceType = resourceType || extracted.resourceType;
    }

    if (!publicId) {
      return res.status(400).json({ success: false, message: "publicId or url is required" });
    }

    if (!resourceType) {
      try {
        const meta = await cloudinary.api.resource(publicId, { resource_type: "auto", type: "authenticated" });
        resourceType = meta.resource_type || resourceType;
      } catch (e) {
        for (const t of ["video", "image", "raw"]) {
          try {
            const meta2 = await cloudinary.api.resource(publicId, { resource_type: t, type: "authenticated" });
            resourceType = meta2.resource_type || t;
            break;
          } catch (err) {
            console.warn("Failed to get resource type:", err.message);
          }
        }
      }
    }

    if (!resourceType) resourceType = "raw";

    const expires_at = Math.floor(Date.now() / 1000) + Number(expiresInSec || 300);

    const signedUrl = cloudinary.utils.private_download_url(publicId, undefined, {
      resource_type: resourceType,
      type: "authenticated",
      expires_at,
    });

    return res.status(200).json({ success: true, url: signedUrl, expiresAt: expires_at, publicId, resourceType });
  } catch (err) {
    console.error("getAssetUrl error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to generate asset URL" });
  }
};
