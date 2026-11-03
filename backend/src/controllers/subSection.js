const Section = require("../models/section");
const SubSection = require("../models/subSection");
const { uploadFileToCloudinary, deleteResourceFromCloudinary } = require("../utils/fileUploader");
const { canManageCourse, findCourseForSection } = require("../utils/courseAccess");
const { deleteSubSectionAssets } = require("../utils/courseCleanup");
const { isObjectId, sendServerError } = require("../utils/validators");

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 2048;
const FILE_FIELDS = ["supportMaterials", "video", "pdf", "html"];

const collectIncomingFiles = (files) =>
  FILE_FIELDS.flatMap((field) => {
    const value = files?.[field];
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });

const parseJsonArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isValidExternalUrl = (value) => {
  if (typeof value !== "string" || value.length > MAX_URL_LENGTH) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const isInvalidText = (value, maxLength) => value !== undefined && (typeof value !== "string" || value.length > maxLength);

async function uploadMaterials(files, meta) {
  const materials = [];
  for (const file of files) {
    const uploaded = await uploadFileToCloudinary(file, process.env.FOLDER_NAME);
    const fileMeta = meta.find((entry) => entry && entry.originalName === file.name) || {};
    materials.push({
      url: uploaded.secure_url || null,
      publicId: uploaded.public_id || null,
      originalName: file.name || null,
      mimeType: file.mimetype || null,
      size: file.size || null,
      resourceType: uploaded.resource_type || uploaded._resource_type || null,
      isMainVideo: !!fileMeta.isMainVideo,
      isMainPdf: !!fileMeta.isMainPdf,
      isMainHtml: !!fileMeta.isMainHtml,
    });
  }
  return materials;
}

async function resolveManagedSection(req, res, sectionId, subSectionId) {
  const course = await findCourseForSection(sectionId);
  if (!course) {
    res.status(404).json({ success: false, message: "Section not found" });
    return false;
  }
  if (!canManageCourse(req, course)) {
    res.status(403).json({ success: false, message: "Forbidden: you do not own this course" });
    return false;
  }
  if (subSectionId) {
    const section = await Section.findOne({ _id: sectionId, subSection: subSectionId }).select("_id");
    if (!section) {
      res.status(404).json({ success: false, message: "SubSection not found in this section" });
      return false;
    }
  }
  return true;
}

exports.createSubSection = async (req, res) => {
  try {
    const { title, description, sectionId, externalVideoUrl } = req.body || {};

    if (!title || !description || !sectionId) {
      return res.status(400).json({ success: false, message: "Title, description and sectionId are required" });
    }
    if (isInvalidText(title, MAX_TITLE_LENGTH) || isInvalidText(description, MAX_DESCRIPTION_LENGTH)) {
      return res.status(400).json({ success: false, message: "Invalid title or description" });
    }
    if (!isObjectId(sectionId)) {
      return res.status(400).json({ success: false, message: "Invalid sectionId" });
    }
    if (externalVideoUrl && !isValidExternalUrl(externalVideoUrl)) {
      return res.status(400).json({ success: false, message: "externalVideoUrl must be an http(s) URL" });
    }

    const incomingFiles = collectIncomingFiles(req.files);
    const meta = parseJsonArray(req.body.supportMaterialsMeta);

    if (!incomingFiles.length && !meta.length && !externalVideoUrl) {
      return res.status(400).json({ success: false, message: "At least one file (video, pdf, or html) or an external video URL is required" });
    }

    if (!(await resolveManagedSection(req, res, sectionId))) return;

    const supportMaterials = await uploadMaterials(incomingFiles, meta);
    const created = await SubSection.create({
      title,
      timeDuration: 0,
      description,
      supportMaterials,
      externalVideoUrl: externalVideoUrl || null,
    });

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $push: { subSection: created._id } },
      { new: true }
    ).populate("subSection");

    return res.status(200).json({ success: true, data: updatedSection, message: "SubSection created successfully" });
  } catch (error) {
    return sendServerError(res, "Error while creating SubSection:", error, "Error while creating SubSection");
  }
};

exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description, removeSupport = "[]" } = req.body || {};

    if (!subSectionId || !sectionId) {
      return res.status(400).json({ success: false, message: "sectionId and subSectionId are required" });
    }
    if (!isObjectId(sectionId) || !isObjectId(subSectionId)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    if (isInvalidText(title, MAX_TITLE_LENGTH) || isInvalidText(description, MAX_DESCRIPTION_LENGTH)) {
      return res.status(400).json({ success: false, message: "Invalid title or description" });
    }
    const hasExternalUrl = Object.prototype.hasOwnProperty.call(req.body, "externalVideoUrl");
    if (hasExternalUrl && req.body.externalVideoUrl && !isValidExternalUrl(req.body.externalVideoUrl)) {
      return res.status(400).json({ success: false, message: "externalVideoUrl must be an http(s) URL" });
    }

    if (!(await resolveManagedSection(req, res, sectionId, subSectionId))) return;

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) return res.status(404).json({ success: false, message: "SubSection not found" });

    if (title) subSection.title = title;
    if (description) subSection.description = description;
    if (hasExternalUrl) subSection.externalVideoUrl = req.body.externalVideoUrl || null;

    const removeList = parseJsonArray(removeSupport);
    if (removeList.length) {
      const remaining = [];
      for (const item of subSection.supportMaterials) {
        const shouldRemove = [item.publicId, item.url, item.originalName].some((key) => key && removeList.includes(key));
        if (!shouldRemove) {
          remaining.push(item);
          continue;
        }
        try {
          await deleteResourceFromCloudinary(item.publicId || item.url, item.resourceType);
        } catch (error) {
          console.error("Failed deleting support material:", error.message);
        }
      }
      subSection.supportMaterials = remaining;
    }

    const uploaded = await uploadMaterials(collectIncomingFiles(req.files), parseJsonArray(req.body.supportMaterialsMeta));
    subSection.supportMaterials.push(...uploaded);

    const hasMain = subSection.supportMaterials.some((item) => item.isMainVideo || item.isMainPdf || item.isMainHtml);
    if (!hasMain && !subSection.externalVideoUrl) {
      return res.status(400).json({ success: false, message: "SubSection must have at least one main video, main PDF, main HTML, or an external video URL" });
    }

    await subSection.save();

    const updatedSection = await Section.findById(sectionId).populate("subSection");
    return res.json({ success: true, data: updatedSection, message: "Section updated successfully" });
  } catch (error) {
    return sendServerError(res, "Error while updating the section:", error, "Error while updating sub-section");
  }
};

exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body || {};

    if (!subSectionId || !sectionId) {
      return res.status(400).json({ success: false, message: "sectionId and subSectionId are required" });
    }
    if (!isObjectId(sectionId) || !isObjectId(subSectionId)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    if (!(await resolveManagedSection(req, res, sectionId, subSectionId))) return;

    const subSection = await SubSection.findById(subSectionId);
    if (subSection) await deleteSubSectionAssets(subSection);

    await Section.updateOne({ _id: sectionId }, { $pull: { subSection: subSectionId } });
    await SubSection.deleteOne({ _id: subSectionId });

    const updatedSection = await Section.findById(sectionId).populate("subSection");
    return res.json({ success: true, data: updatedSection, message: "SubSection deleted successfully" });
  } catch (error) {
    return sendServerError(res, "Error while deleting sub-section", error, "Error while deleting sub-section");
  }
};
