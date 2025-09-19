function extractPublicIdAndResourceType(url) {
    if (!url || typeof url !== "string") return { publicId: null, resourceType: null };
    try {
        const u = new URL(url);
        const parts = u.pathname.split("/").filter(Boolean);
        const uploadIdx = parts.findIndex((p) => p === "upload");
        if (uploadIdx === -1) return { publicId: null, resourceType: null };

        const maybeType = parts[uploadIdx - 1] || null;
        const after = parts.slice(uploadIdx + 1).filter((seg) => !/^v\d+$/.test(seg));
        if (!after.length) return { publicId: null, resourceType: maybeType };

        const last = after.pop();
        const filename = last.includes(".") ? last.substring(0, last.lastIndexOf(".")) : last;
        const folderPath = after.length ? after.join("/") + "/" : "";
        const publicId = `${folderPath}${filename}`;

        const allowed = ["image", "video", "raw", "auto", "javascript", "css"];
        const normalized = allowed.includes(maybeType) ? maybeType : null;

        return { publicId, resourceType: normalized };
    } catch (err) {
        return { publicId: null, resourceType: null };
    }
}

module.exports = { extractPublicIdAndResourceType };
