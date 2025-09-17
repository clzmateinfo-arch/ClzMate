const Section = require("../models/section");
const SubSection = require("../models/subSection");
const {
    uploadFileToCloudinary,
    deleteResourceFromCloudinary,
} = require("../utils/fileUploader");

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
        const { title, description, sectionId } = req.body;
        const videoFile = pickSingle(req.files, "video");
        const pdfFile = pickSingle(req.files, "pdf");
        const supportFiles = pickMany(req.files, "supportMaterials");

        if (!title || !description || !sectionId || (!videoFile && !pdfFile)) {
            return res.status(400).json({
                success: false,
                message: "Title, description, sectionId and either a video or a PDF are required",
            });
        }

        let videoUrl = null;
        let timeDuration = 0;
        if (videoFile) {
            const v = await uploadFileToCloudinary(videoFile, process.env.FOLDER_NAME);
            videoUrl = v.secure_url || null;
            if (typeof v.duration !== "undefined") timeDuration = v.duration;
        }

        let pdfUrl = null;
        if (pdfFile) {
            const p = await uploadFileToCloudinary(pdfFile, process.env.FOLDER_NAME);
            pdfUrl = p.secure_url || null;
        }

        const supportMaterialsMeta = [];
        if (supportFiles.length) {
            for (const f of supportFiles) {
                const d = await uploadFileToCloudinary(f, process.env.FOLDER_NAME);
                supportMaterialsMeta.push({
                    url: d.secure_url || null,
                    originalName: f.name || null,
                    mimeType: f.mimetype || null,
                    size: f.size || null,
                });
            }
        }

        const created = await SubSection.create({
            title,
            timeDuration: timeDuration || 0,
            description,
            videoUrl,
            pdfUrl,
            supportMaterials: supportMaterialsMeta,
        });

        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: created._id } },
            { new: true }
        ).populate("subSection");

        return res.status(200).json({
            success: true,
            data: updatedSection,
            message: "SubSection created successfully",
        });
    } catch (error) {
        console.error("Error while creating SubSection:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description, removeSupport = "[]" } = req.body;

        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: "subSection ID is required to update",
            });
        }

        const subSection = await SubSection.findById(subSectionId);
        if (!subSection) return res.status(404).json({ success: false, message: "SubSection not found" });

        if (title) subSection.title = title;
        if (description) subSection.description = description;

        let removeSupportArr = [];
        try {
            removeSupportArr = JSON.parse(removeSupport);
            if (!Array.isArray(removeSupportArr)) removeSupportArr = [];
        } catch (e) {
            removeSupportArr = [];
        }

        // remove requested support items by matching URL or originalName
        if (removeSupportArr.length && Array.isArray(subSection.supportMaterials)) {
            subSection.supportMaterials = subSection.supportMaterials.filter((item) => {
                const shouldRemove = removeSupportArr.includes(item.url) || removeSupportArr.includes(item.originalName);
                if (shouldRemove) {
                    // attempt to delete from Cloudinary using URL (util will derive public_id)
                    try {
                        deleteResourceFromCloudinary(item.url).catch((err) => console.warn("Failed deleting support material:", err.message));
                    } catch (err) {
                        console.warn("Failed deleting support material:", err.message);
                    }
                    return false;
                }
                return true;
            });
        }

        const newVideo = pickSingle(req.files, "video");
        const newPdf = pickSingle(req.files, "pdf");
        const newSupportFiles = pickMany(req.files, "supportMaterials");

        if (newVideo) {
            // delete existing video by stored URL (derive public id inside function)
            if (subSection.videoUrl) {
                try {
                    await deleteResourceFromCloudinary(subSection.videoUrl);
                } catch (e) {
                    console.warn("delete old video failed:", e.message);
                }
            }
            const detail = await uploadFileToCloudinary(newVideo, process.env.FOLDER_NAME);
            subSection.videoUrl = detail.secure_url || null;
            if (typeof detail.duration !== "undefined") subSection.timeDuration = detail.duration;
        }

        if (newPdf) {
            if (subSection.pdfUrl) {
                try {
                    await deleteResourceFromCloudinary(subSection.pdfUrl);
                } catch (e) {
                    console.warn("delete old pdf failed:", e.message);
                }
            }
            const detail = await uploadFileToCloudinary(newPdf, process.env.FOLDER_NAME);
            subSection.pdfUrl = detail.secure_url || null;
        }

        if (newSupportFiles && newSupportFiles.length) {
            const appended = [];
            for (const f of newSupportFiles) {
                const d = await uploadFileToCloudinary(f, process.env.FOLDER_NAME);
                appended.push({
                    url: d.secure_url || null,
                    originalName: f.name || null,
                    mimeType: f.mimetype || null,
                    size: f.size || null,
                });
            }
            subSection.supportMaterials = Array.isArray(subSection.supportMaterials)
                ? subSection.supportMaterials.concat(appended)
                : appended;
        }

        if (!subSection.videoUrl && !subSection.pdfUrl) {
            return res.status(400).json({ success: false, message: "SubSection must have at least one of: video or pdf" });
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
        if (!subSection) {
            return res.status(404).json({ success: false, message: "SubSection not found" });
        }

        try { if (subSection.videoUrl) await deleteResourceFromCloudinary(subSection.videoUrl); } catch (e) { console.warn(e.message); }
        try { if (subSection.pdfUrl) await deleteResourceFromCloudinary(subSection.pdfUrl); } catch (e) { console.warn(e.message); }
        if (Array.isArray(subSection.supportMaterials)) {
            for (const item of subSection.supportMaterials) {
                try { await deleteResourceFromCloudinary(item.url); } catch (e) { console.warn("Failed delete support item:", e.message); }
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
