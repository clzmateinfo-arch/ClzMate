// src/controllers/asset.js
const cloudinary = require("cloudinary").v2;
const { extractPublicIdFromUrl } = require("../utils/cloudinaryId");

/**
 * POST /api/v1/course/getAssetUrl
 * Body: { publicId?, url?, expiresInSec? (default 300) }
 */
exports.getAssetUrl = async (req, res) => {
    try {
        const { publicId: bodyPublicId, url, expiresInSec = 300, format = null } = req.body;

        let publicId = bodyPublicId || null;
        if (!publicId && url) {
            publicId = extractPublicIdFromUrl(url);
        }

        if (!publicId) {
            return res.status(400).json({ success: false, message: "publicId or url required" });
        }

        // try to get resource metadata to determine resource_type or format
        let resourceType = "auto";
        let detectedFormat = format || undefined;
        try {
            const meta = await cloudinary.api.resource(publicId, { resource_type: "auto", type: "authenticated" });
            if (meta && meta.resource_type) resourceType = meta.resource_type;
            if (!detectedFormat && meta && meta.format) detectedFormat = meta.format;
        } catch (metaErr) {
            // metadata lookup may fail for some cases; fall back to 'auto'
        }

        const expires_at = Math.floor(Date.now() / 1000) + Number(expiresInSec || 300);

        // returns a signed URL for downloading the original asset
        const signedUrl = cloudinary.utils.private_download_url(publicId, detectedFormat, {
            resource_type: resourceType === "auto" ? undefined : resourceType,
            type: "authenticated",
            expires_at,
        });

        return res.status(200).json({ success: true, url: signedUrl, expiresAt: expires_at });
    } catch (err) {
        console.error("Error while generating asset URL:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
