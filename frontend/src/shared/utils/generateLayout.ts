// src/pages/course/layouts/generateLayout.js
// Generates tiled box positions (top,left,width,height in viewport `%`) for the
// course viewer. Strategy: reserve left "section" column (15% by default) then
// tile the remaining content area according to number of panels.
//
// Panels order (priority): mainVideo, mainPdf, notes, support, sandbox
// Supports 1..5 panels (besides section). Layout templates chosen to keep primary
// content large while guaranteeing no gaps.

export function generateLayout({
    features = { sandboxEnabled: false, notesEnabled: true },
    currentSub = null,
    sectionWidth = 15, // percent of width reserved for left sidebar
}) {
    // helpers
    const hasPdf = !!(currentSub && Array.isArray(currentSub.supportMaterials) &&
        currentSub.supportMaterials.find(s => (s.mimeType || "").toLowerCase() === "application/pdf" || s.isMainPdf || (s.originalName || "").toLowerCase().endsWith(".pdf")));
    const hasVideo = !!(currentSub && Array.isArray(currentSub.supportMaterials) &&
        currentSub.supportMaterials.find(s => s.isMainVideo || (s.resourceType || "").startsWith("video") || (s.mimeType || "").startsWith("video")));
    const panels = [];

    // order priority
    if (hasVideo) panels.push({ id: "video", type: "video" });
    if (hasPdf) panels.push({ id: "pdf", type: "pdf" });
    if (features.notesEnabled) panels.push({ id: "notes", type: "notes" });
    // support is always present in our UI
    panels.push({ id: "support", type: "support" });
    if (features.sandboxEnabled) panels.push({ id: "sandbox", type: "sandbox" });

    // Remove duplicates (just in case)
    const panelIdsSeen = new Set();
    const uniqPanels = [];
    for (const p of panels) {
        if (!panelIdsSeen.has(p.id)) {
            panelIdsSeen.add(p.id);
            uniqPanels.push(p);
        }
    }

    const contentWidth = Math.max(0, 100 - sectionWidth);
    const out = [];

    // Section box (left column)
    out.push({
        id: "section",
        title: "Sections",
        top: 0,
        left: 0,
        width: sectionWidth,
        height: 100,
    });

    const pcount = uniqPanels.length;

    // Layout templates (tile the content area exactly)
    // We compute relative positions in the content area (0..100) then map to vw using left += sectionWidth
    const addTile = (id, relTop, relLeft, relW, relH, title, type) => {
        out.push({
            id,
            title: title || id.charAt(0).toUpperCase() + id.slice(1),
            type: type || id,
            top: relTop * 100 / 100, // already in 0..100 scale
            left: sectionWidth + relLeft * contentWidth / 100,
            width: (relW * contentWidth) / 100,
            height: relH,
            visible: true,
            z: 100,
        });
    };

    // Templates:
    // pcount = 0 -> only section (nothing else)
    if (pcount === 0) {
        // nothing else
        return out;
    }

    // pcount === 1 -> single tile: fill entire content area
    if (pcount === 1) {
        addTile(uniqPanels[0].id, 0, 0, 100, 100);
        return out;
    }

    // pcount === 2 -> split horizontally (top 60 / bottom 40) if one is video prefer top; else 50/50
    if (pcount === 2) {
        // if first panel is video, make it larger
        const topH = (uniqPanels[0].type === "video") ? 60 : 50;
        addTile(uniqPanels[0].id, 0, 0, 100, topH);
        addTile(uniqPanels[1].id, topH, 0, 100, 100 - topH);
        return out;
    }

    // pcount === 3 -> left main large (66%) and right column stacked (34%) with two rows
    if (pcount === 3) {
        addTile(uniqPanels[0].id, 0, 0, 66, 100); // large left
        // right column width 34, split into two equal rows
        addTile(uniqPanels[1].id, 0, 66, 34, 50);
        addTile(uniqPanels[2].id, 50, 66, 34, 50);
        return out;
    }

    // pcount === 4 -> regular 2x2 grid (each 50% width/height)
    if (pcount === 4) {
        addTile(uniqPanels[0].id, 0, 0, 50, 50);
        addTile(uniqPanels[1].id, 0, 50, 50, 50);
        addTile(uniqPanels[2].id, 50, 0, 50, 50);
        addTile(uniqPanels[3].id, 50, 50, 50, 50);
        return out;
    }

    // pcount >= 5 -> Left column large (60%) with primary two stacked (each 50% of left height),
    // right column (40%) split into three rows for the rest; if more than 5, stack extras in right column (equal heights)
    if (pcount >= 5) {
        addTile(uniqPanels[0].id, 0, 0, 60, 50); // left top
        addTile(uniqPanels[1].id, 50, 0, 60, 50); // left bottom
        const rightCount = pcount - 2;
        const rightWidthStart = 60;
        const slotH = Math.floor(100 / rightCount);
        let accumTop = 0;
        for (let i = 0; i < rightCount; i++) {
            const idx = 2 + i;
            // last slot gets remaining height to avoid rounding gap
            const height = (i === rightCount - 1) ? (100 - accumTop) : slotH;
            addTile(uniqPanels[idx].id, accumTop, rightWidthStart, 40, height);
            accumTop += height;
        }
        return out;
    }

    return out;
}
