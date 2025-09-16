// controllers/subSection.js
const Section = require("../models/section");
const SubSection = require("../models/subSection");
const {
    uploadImageToCloudinary,
    deleteResourceFromCloudinary,
} = require("../utils/imageUploader");

// helpers
const getSingleFile = (files, key) => {
    if (!files) return null;
    const entry = files[key];
    if (!entry) return null;
    return Array.isArray(entry) ? entry[0] : entry;
};
const getMultipleFiles = (files, key) => {
    if (!files) return [];
    const entry = files[key];
    return Array.isArray(entry) ? entry : entry ? [entry] : [];
};

exports.createSubSection = async (req, res) => {
    try {
        console.log("createSubSection req.body:", req.body);
        console.log("createSubSection req.files keys:", req.files ? Object.keys(req.files) : "no files");
        // normalize
        const { title, description, sectionId } = req.body;
        const videoFile = getSingleFile(req.files, "video");
        const pdfFile = getSingleFile(req.files, "pdf");
        const supportFiles = getMultipleFiles(req.files, "supportMaterials");

        if (!title || !description || !sectionId || (!videoFile && !pdfFile)) {
            return res.status(400).json({
                success: false,
                message: "Title, description, sectionId and either a video or a PDF are required",
            });
        }

        // upload video/pdf/support files
        let videoUrl = null;
        let videoPublicId = null;
        let timeDuration = 0;

        if (videoFile) {
            const videoDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);
            videoUrl = videoDetails.secure_url;
            videoPublicId = videoDetails.public_id || null;
            if (videoDetails.duration) timeDuration = videoDetails.duration;
        }

        let pdfUrl = null;
        let pdfPublicId = null;
        if (pdfFile) {
            const pdfDetails = await uploadImageToCloudinary(pdfFile, process.env.FOLDER_NAME);
            pdfUrl = pdfDetails.secure_url;
            pdfPublicId = pdfDetails.public_id || null;
        }

        const supportMaterialsMeta = [];
        if (supportFiles.length) {
            for (const f of supportFiles) {
                const detail = await uploadImageToCloudinary(f, process.env.FOLDER_NAME);
                supportMaterialsMeta.push({
                    url: detail.secure_url,
                    publicId: detail.public_id || null,
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
            videoPublicId,
            pdfUrl,
            pdfPublicId,
            supportMaterials: supportMaterialsMeta,
        });

        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
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
        console.log("updateSubSection req.body:", req.body);
        console.log("updateSubSection req.files keys:", req.files ? Object.keys(req.files) : "no files");

        const { sectionId, subSectionId, title, description } = req.body;
        if (!subSectionId) {
            return res.status(400).json({ success: false, message: "subSection ID is required to update" });
        }

        const subSection = await SubSection.findById(subSectionId);
        if (!subSection) return res.status(404).json({ success: false, message: "SubSection not found" });

        // update text
        if (title) subSection.title = title;
        if (description) subSection.description = description;

        // new files (if any)
        const newVideo = getSingleFile(req.files, "video");
        const newPdf = getSingleFile(req.files, "pdf");
        const newSupportFiles = getMultipleFiles(req.files, "supportMaterials");

        // replace video if new provided
        if (newVideo) {
            if (subSection.videoPublicId) {
                try { await deleteResourceFromCloudinary(subSection.videoPublicId); } catch (e) { console.warn(e.message); }
            }
            const detail = await uploadImageToCloudinary(newVideo, process.env.FOLDER_NAME);
            subSection.videoUrl = detail.secure_url;
            subSection.videoPublicId = detail.public_id || null;
            if (detail.duration) subSection.timeDuration = detail.duration;
        }

        // replace pdf if new provided
        if (newPdf) {
            if (subSection.pdfPublicId) {
                try { await deleteResourceFromCloudinary(subSection.pdfPublicId); } catch (e) { console.warn(e.message); }
            }
            const detail = await uploadImageToCloudinary(newPdf, process.env.FOLDER_NAME);
            subSection.pdfUrl = detail.secure_url;
            subSection.pdfPublicId = detail.public_id || null;
        }

        // append support materials (do not auto-delete existing unless requested)
        if (newSupportFiles && newSupportFiles.length) {
            const appended = [];
            for (const f of newSupportFiles) {
                const d = await uploadImageToCloudinary(f, process.env.FOLDER_NAME);
                appended.push({
                    url: d.secure_url,
                    publicId: d.public_id || null,
                    originalName: f.name || null,
                    mimeType: f.mimetype || null,
                    size: f.size || null,
                });
            }
            subSection.supportMaterials = Array.isArray(subSection.supportMaterials)
                ? subSection.supportMaterials.concat(appended)
                : appended;
        }

        // ensure at least one of video or pdf remains
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
