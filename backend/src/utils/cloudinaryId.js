function extractPublicIdFromUrl(url) {
    if (!url || typeof url !== "string") return null;

    try {
        const u = new URL(url);
        const segments = u.pathname.split("/").filter(Boolean);
        const uploadIndex = segments.findIndex((s) => s === "upload");
        if (uploadIndex === -1) {
            return null;
        }

        const after = segments.slice(uploadIndex + 1);
        const filtered = after.filter((part) => !/^v\d+$/.test(part));
        if (!filtered.length) return null;

        const last = filtered.pop();
        const filename = last.includes(".") ? last.substring(0, last.lastIndexOf(".")) : last;

        const folderPath = filtered.length ? filtered.join("/") + "/" : "";
        const publicId = `${folderPath}${filename}`;
        return publicId;
    } catch (e) {
        return null;
    }
}

module.exports = { extractPublicIdFromUrl };
