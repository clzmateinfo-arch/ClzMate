const Section = require("../models/section");
const SubSection = require("../models/subSection");
const { uploadFileToCloudinary, deleteResourceFromCloudinary } = require("../utils/fileUploader");

const pickSingle = (files, key) => {
  if (!files) return null;
  const val = files[key];
  if (!val) return null;
  return Array.isArray(val) ? val[0] : val;
};
const pickMany = (files, key) => {
  if (!files) return [];
  const val = files[key];
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

exports.createSubSection = async (req, res) => {
  try {

    const { title, description, sectionId, externalVideoUrl } = req.body;
    if (!title || !description || !sectionId) {
      return res.status(400).json({ success: false, message: "Title, description and sectionId are required" });
    }

    let meta = [];
    if (req.body.supportMaterialsMeta) {
      try { meta = JSON.parse(req.body.supportMaterialsMeta); } catch (e) { meta = []; }
    }

    const incomingFiles = [];
    const list = pickMany(req.files, "supportMaterials");
    if (list && list.length) incomingFiles.push(...list);

    const legacyVideo = pickSingle(req.files, "video");
    const legacyPdf = pickSingle(req.files, "pdf");
    const legacyHtml = pickSingle(req.files, "html");
    if (legacyVideo) incomingFiles.push(legacyVideo);
    if (legacyPdf) incomingFiles.push(legacyPdf);
    if (legacyHtml) incomingFiles.push(legacyHtml);

    if (!incomingFiles.length && (!meta || meta.length === 0) && !externalVideoUrl) {
      return res.status(400).json({ success: false, message: "At least one file (video, pdf, or html) or an external video URL is required" });
    }

    const supportMaterials = [];
    for (const f of incomingFiles) {
      const uploaded = await uploadFileToCloudinary(f, process.env.FOLDER_NAME);
      const foundMeta = (meta || []).find((m) => m.originalName === f.name) || {};
      supportMaterials.push({
        url: uploaded.secure_url || null,
        publicId: uploaded.public_id || null,
        originalName: f.name || null,
        mimeType: f.mimetype || null,
        size: f.size || null,
        resourceType: uploaded.resource_type || uploaded._resource_type || null,
        isMainVideo: !!foundMeta.isMainVideo,
        isMainPdf: !!foundMeta.isMainPdf,
        isMainHtml: !!foundMeta.isMainHtml,
      });
    }

    let timeDuration = 0;

    const created = await SubSection.create({
      title,
      timeDuration: timeDuration || 0,
      description,
      supportMaterials,
      externalVideoUrl: externalVideoUrl || null,
    });

    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSection: created._id } },
      { new: true }
    ).populate("subSection");

    return res.status(200).json({ success: true, data: updatedSection, message: "SubSection created successfully" });
  } catch (error) {
    console.error("Error while creating SubSection:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description, removeSupport = "[]" } = req.body;
    if (!subSectionId) return res.status(400).json({ success: false, message: "subSection ID is required to update" });

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) return res.status(404).json({ success: false, message: "SubSection not found" });

    if (title) subSection.title = title;
    if (description) subSection.description = description;

    if (Object.prototype.hasOwnProperty.call(req.body, "externalVideoUrl")) {
      const ext = req.body.externalVideoUrl || null;
      subSection.externalVideoUrl = ext;
    }

    let removeArr = [];
    try { removeArr = JSON.parse(removeSupport); if (!Array.isArray(removeArr)) removeArr = []; } catch (e) { removeArr = []; }

    if (removeArr.length && Array.isArray(subSection.supportMaterials)) {
      const remaining = [];
      for (const item of subSection.supportMaterials) {
        if (removeArr.includes(item.publicId) || removeArr.includes(item.url) || removeArr.includes(item.originalName)) {
          try { await deleteResourceFromCloudinary(item.publicId || item.url, item.resourceType); } catch (e) { console.warn("Failed deleting support material:", e.message); }
          continue;
        }
        remaining.push(item);
      }
      subSection.supportMaterials = remaining;
    }

    let meta = [];
    if (req.body.supportMaterialsMeta) {
      try { meta = JSON.parse(req.body.supportMaterialsMeta); } catch (e) { meta = []; }
    }

    const newFiles = pickMany(req.files, "supportMaterials");
    const legacyVideo = pickSingle(req.files, "video");
    const legacyPdf = pickSingle(req.files, "pdf");
    const legacyHtml = pickSingle(req.files, "html");
    const allNew = [];
    if (newFiles && newFiles.length) allNew.push(...newFiles);
    if (legacyVideo) allNew.push(legacyVideo);
    if (legacyPdf) allNew.push(legacyPdf);
    if (legacyHtml) allNew.push(legacyHtml);

    if (allNew.length) {
      for (const f of allNew) {
        const d = await uploadFileToCloudinary(f, process.env.FOLDER_NAME);
        const fm = (meta || []).find((m) => m.originalName === f.name) || {};
        subSection.supportMaterials.push({
          url: d.secure_url || null,
          publicId: d.public_id || null,
          originalName: f.name || null,
          mimeType: f.mimetype || null,
          size: f.size || null,
          resourceType: d.resource_type || d._resource_type || null,
          isMainVideo: !!fm.isMainVideo,
          isMainPdf: !!fm.isMainPdf,
          isMainHtml: !!fm.isMainHtml,
        });
      }
    }

    const hasMain = (subSection.supportMaterials || []).some((s) => s.isMainVideo || s.isMainPdf || s.isMainHtml);
    if (!hasMain && !subSection.externalVideoUrl) {
      return res.status(400).json({ success: false, message: "SubSection must have at least one main video, main PDF, main HTML, or an external video URL" });
    }

    await subSection.save();

    const updatedSection = await Section.findById(sectionId).populate("subSection");
    return res.json({ success: true, data: updatedSection, message: "Section updated successfully" });
  } catch (error) {
    console.error("Error while updating the section:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;
    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) return res.status(404).json({ success: false, message: "SubSection not found" });

    if (Array.isArray(subSection.supportMaterials)) {
      for (const item of subSection.supportMaterials) {
        try { await deleteResourceFromCloudinary(item.publicId || item.url, item.resourceType); } catch (e) { console.warn("Failed delete support item:", e.message); }
      }
    }

    await Section.findByIdAndUpdate({ _id: sectionId }, { $pull: { subSection: subSectionId } });
    await SubSection.findByIdAndDelete(subSectionId);

    const updatedSection = await Section.findById(sectionId).populate("subSection");
    return res.json({ success: true, data: updatedSection, message: "SubSection deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
