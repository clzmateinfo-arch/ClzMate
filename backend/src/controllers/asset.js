const cloudinary = require("cloudinary").v2;
const Course = require("../models/course");
const Section = require("../models/section");
const SubSection = require("../models/subSection");
const User = require("../models/user");
const { canManageCourse, isAdminUser, isEnrolledOrOwner } = require("../utils/courseAccess");
const { escapeRegex } = require("../middleware/sanitize");
const { sendServerError } = require("../utils/validators");

const MIN_EXPIRY_SECONDS = 60;
const MAX_EXPIRY_SECONDS = 3600;
const DEFAULT_EXPIRY_SECONDS = 300;
const MAX_IDENTIFIER_LENGTH = 2048;

const DELIVERY_MARKERS = ["upload", "authenticated", "private"];
const RESOURCE_TYPES = ["image", "video", "raw"];

function extractPublicIdAndResourceType(url) {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const markerIndex = segments.findIndex((segment) => DELIVERY_MARKERS.includes(segment));
    if (markerIndex < 1) return { publicId: null, resourceType: null };

    const resourceType = RESOURCE_TYPES.includes(segments[markerIndex - 1]) ? segments[markerIndex - 1] : null;
    const rest = segments
      .slice(markerIndex + 1)
      .filter((segment) => !/^v\d+$/.test(segment) && !/^s--.*--$/.test(segment));
    if (!rest.length) return { publicId: null, resourceType };

    const last = rest.pop();
    const dotIndex = last.lastIndexOf(".");
    const baseName = dotIndex > 0 && resourceType !== "raw" ? last.slice(0, dotIndex) : last;
    return { publicId: [...rest, baseName].join("/"), resourceType };
  } catch {
    return { publicId: null, resourceType: null };
  }
}

const isIdentifier = (value) => typeof value === "string" && value.length > 0 && value.length <= MAX_IDENTIFIER_LENGTH;

const clampExpiry = (raw) => {
  const seconds = Number(raw);
  if (!Number.isFinite(seconds)) return DEFAULT_EXPIRY_SECONDS;
  return Math.min(Math.max(Math.floor(seconds), MIN_EXPIRY_SECONDS), MAX_EXPIRY_SECONDS);
};

const inferResourceType = (mimeType) => {
  if (typeof mimeType === "string" && mimeType.startsWith("video")) return "video";
  if (typeof mimeType === "string" && mimeType.startsWith("image")) return "image";
  return "raw";
};

async function findAuthorizedSubSectionAsset(req, { publicId, url }) {
  const criteria = [];
  if (publicId) criteria.push({ publicId });
  if (url) criteria.push({ url });

  const subSection = await SubSection.findOne({ supportMaterials: { $elemMatch: { $or: criteria } } });
  if (!subSection) return { found: false };

  const material = subSection.supportMaterials.find((item) => (publicId && item.publicId === publicId) || (url && item.url === url));
  const section = await Section.findOne({ subSection: subSection._id }).select("_id");
  const course = section && (await Course.findOne({ courseContent: section._id }).select("instructor studentsEnrolled"));

  const isAllowed = !!course && (await isEnrolledOrOwner(req, course));
  return {
    found: true,
    isAllowed,
    asset: { publicId: material.publicId, resourceType: material.resourceType || inferResourceType(material.mimeType) },
  };
}

async function findAuthorizedThumbnailAsset(req, { publicId, url }) {
  const thumbnailFilter = url
    ? { thumbnail: url }
    : { thumbnail: { $regex: `/${escapeRegex(publicId)}(\\.[a-z0-9]+)?$` } };
  const course = await Course.findOne(thumbnailFilter).select("instructor thumbnail status");
  if (!course) return { found: false };

  const extracted = extractPublicIdAndResourceType(course.thumbnail);
  const isAllowed = course.status === "Published" || canManageCourse(req, course) || isAdminUser(req);
  return {
    found: !!extracted.publicId,
    isAllowed,
    asset: { publicId: extracted.publicId, resourceType: extracted.resourceType || "image" },
  };
}

async function findAuthorizedProfileImageAsset({ url }) {
  if (!url) return { found: false };
  const owner = await User.findOne({ image: url }).select("_id");
  if (!owner) return { found: false };
  const extracted = extractPublicIdAndResourceType(url);
  return {
    found: !!extracted.publicId,
    isAllowed: true,
    asset: { publicId: extracted.publicId, resourceType: extracted.resourceType || "image" },
  };
}

exports.getAssetUrl = async (req, res) => {
  try {
    const { url, publicId: providedPublicId, expiresInSec } = req.body || {};

    if ((url !== undefined && !isIdentifier(url)) || (providedPublicId !== undefined && !isIdentifier(providedPublicId))) {
      return res.status(400).json({ success: false, message: "publicId or url is required" });
    }

    const publicId = providedPublicId || (url ? extractPublicIdAndResourceType(url).publicId : null);
    if (!publicId && !url) {
      return res.status(400).json({ success: false, message: "publicId or url is required" });
    }

    const lookup = { publicId, url: url || null };
    let match = await findAuthorizedSubSectionAsset(req, lookup);
    if (!match.found && publicId) match = await findAuthorizedThumbnailAsset(req, { publicId, url: lookup.url });
    if (!match.found) match = await findAuthorizedProfileImageAsset(lookup);

    if (!match.found || !match.isAllowed) {
      return res.status(403).json({ success: false, message: "You do not have access to this asset" });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + clampExpiry(expiresInSec);
    const signedUrl = cloudinary.utils.private_download_url(match.asset.publicId, undefined, {
      resource_type: match.asset.resourceType,
      type: "authenticated",
      expires_at: expiresAt,
    });

    return res.status(200).json({
      success: true,
      url: signedUrl,
      expiresAt,
      publicId: match.asset.publicId,
      resourceType: match.asset.resourceType,
    });
  } catch (error) {
    return sendServerError(res, "getAssetUrl error:", error, "Failed to generate asset URL");
  }
};
