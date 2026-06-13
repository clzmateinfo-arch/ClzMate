export function generateCourseLayout({
    features = { sandboxEnabled: false, notesEnabled: true },
    currentSub = null,
    sectionWidth = 15,
} = {}) {
    const hasPdf = !!(
        currentSub &&
        Array.isArray(currentSub.supportMaterials) &&
        currentSub.supportMaterials.find((s) =>
            (s.mimeType || "").toLowerCase() === "application/pdf" ||
            !!s.isMainPdf ||
            (s.originalName || "").toLowerCase().endsWith(".pdf")
        )
    );

    const hasVideo = !!(
        currentSub &&
        Array.isArray(currentSub.supportMaterials) &&
        currentSub.supportMaterials.find((s) =>
            !!s.isMainVideo ||
            (s.resourceType || "").startsWith("video") ||
            (s.mimeType || "").startsWith("video")
        )
    );

    const hasHtml = !!(
        currentSub &&
        Array.isArray(currentSub.supportMaterials) &&
        currentSub.supportMaterials.find((s) =>
            !!s.isMainHtml ||
            (s.mimeType || "").toLowerCase().includes("html") ||
            (s.originalName || "").toLowerCase().endsWith(".html") ||
            (s.originalName || "").toLowerCase().endsWith(".htm")
        )
    );

    const hasExternal = !!(currentSub && (currentSub.externalVideoUrl || "").toString().trim());

    const panels = [];

    if (hasExternal) panels.push({ id: "external", type: "external" });
    if (hasVideo) panels.push({ id: "video", type: "video" });
    if (hasPdf) panels.push({ id: "pdf", type: "pdf" });
    if (hasHtml) panels.push({ id: "html", type: "html" });
    if (features.notesEnabled) panels.push({ id: "notes", type: "notes" });
    panels.push({ id: "support", type: "support" });
    if (features.sandboxEnabled) panels.push({ id: "sandbox", type: "sandbox" });

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

    out.push({
        id: "section",
        title: "Sections",
        top: 0,
        left: 0,
        width: sectionWidth,
        height: 100,
    });

    const pcount = uniqPanels.length;

    const addTile = (id, relTop, relLeft, relW, relH, title, type) => {
        out.push({
            id,
            title: title || (id.charAt(0).toUpperCase() + id.slice(1)),
            type: type || id,
            top: (relTop * 100) / 100,
            left: sectionWidth + (relLeft * contentWidth) / 100,
            width: (relW * contentWidth) / 100,
            height: relH,
            visible: true,
            z: 100,
        });
    };

    if (pcount === 0) {
        return out;
    }

    if (pcount === 1) {
        addTile(uniqPanels[0].id, 0, 0, 100, 100);
        return out;
    }

    if (pcount === 2) {
        const topH = (uniqPanels[0].type === "video" || uniqPanels[0].type === "external") ? 60 : 50;
        addTile(uniqPanels[0].id, 0, 0, 100, topH);
        addTile(uniqPanels[1].id, topH, 0, 100, 100 - topH);
        return out;
    }

    if (pcount === 3) {
        addTile(uniqPanels[0].id, 0, 0, 66, 100);
        addTile(uniqPanels[1].id, 0, 66, 34, 50);
        addTile(uniqPanels[2].id, 50, 66, 34, 50);
        return out;
    }

    if (pcount === 4) {
        addTile(uniqPanels[0].id, 0, 0, 50, 50);
        addTile(uniqPanels[1].id, 0, 50, 50, 50);
        addTile(uniqPanels[2].id, 50, 0, 50, 50);
        addTile(uniqPanels[3].id, 50, 50, 50, 50);
        return out;
    }

    if (pcount >= 5) {
        addTile(uniqPanels[0].id, 0, 0, 60, 50);
        addTile(uniqPanels[1].id, 50, 0, 60, 50);
        const rightCount = pcount - 2;
        const rightWidthStart = 60;
        const slotH = Math.floor(100 / rightCount);
        let accumTop = 0;
        for (let i = 0; i < rightCount; i++) {
            const idx = 2 + i;
            const height = (i === rightCount - 1) ? (100 - accumTop) : slotH;
            addTile(uniqPanels[idx].id, accumTop, rightWidthStart, 40, height);
            accumTop += height;
        }
        return out;
    }

    return out;
}
