export function generateClassroomLayout({
    features = { sandboxEnabled: false, notesEnabled: true },
    hasExternal = false,
    hasVideo = false,
    hasPdf = false,
    sectionWidth = 16,
    panelsIncluded = null,
} = {}) {
    const defaultOrder = [];

    if (hasExternal) defaultOrder.push("external");
    if (hasVideo) defaultOrder.push("video");
    if (hasPdf) defaultOrder.push("pdf");

    defaultOrder.push("assignments");
    defaultOrder.push("materials");
    defaultOrder.push("quizzes");
    defaultOrder.push("announcements");

    if (features.notesEnabled) defaultOrder.push("notes");
    if (features.sandboxEnabled) defaultOrder.push("sandbox");

    let panels = Array.isArray(panelsIncluded)
        ? panelsIncluded.filter((p) => typeof p === "string" && p.trim())
        : defaultOrder;

    const seen = new Set();
    panels = panels.filter((p) => {
        if (seen.has(p)) return false;
        seen.add(p);
        return true;
    });

    const contentWidth = Math.max(0, 100 - sectionWidth);
    const out = [];

    const TOPICS_HEIGHT = 60;
    const SECTIONS_HEIGHT = 100 - TOPICS_HEIGHT;

    out.push({
        id: "topics",
        title: "Topics",
        top: 0,
        left: 0,
        width: sectionWidth,
        height: TOPICS_HEIGHT,
        visible: true,
        z: 500,
    });

    out.push({
        id: "sections",
        title: "Sections",
        top: TOPICS_HEIGHT,
        left: 0,
        width: sectionWidth,
        height: SECTIONS_HEIGHT,
        visible: true,
        z: 450,
    });

    const pcount = panels.length;

    const addTile = (id, relTopPct, relLeftPct, relWpct, relHpct) => {
        out.push({
            id,
            title: id.charAt(0).toUpperCase() + id.slice(1),
            top: relTopPct,
            left: sectionWidth + (relLeftPct / 100) * contentWidth,
            width: (relWpct / 100) * contentWidth,
            height: relHpct,
            visible: true,
            z: 100,
        });
    };

    if (pcount === 0) return out;

    if (pcount === 1) {
        addTile(panels[0], 0, 0, 100, 100);
        return out;
    }

    if (pcount === 2) {
        addTile(panels[0], 0, 0, 100, 60);
        addTile(panels[1], 60, 0, 100, 40);
        return out;
    }

    if (pcount === 3) {
        addTile(panels[0], 0, 0, 70, 100);
        addTile(panels[1], 0, 70, 30, 50);
        addTile(panels[2], 50, 70, 30, 50);
        return out;
    }

    if (pcount === 4) {
        addTile(panels[0], 0, 0, 50, 50);
        addTile(panels[1], 0, 50, 50, 50);
        addTile(panels[2], 50, 0, 50, 50);
        addTile(panels[3], 50, 50, 50, 50);
        return out;
    }

    addTile(panels[0], 0, 0, 60, 50);
    addTile(panels[1], 50, 0, 60, 50);

    const rightCount = Math.max(1, pcount - 2);
    const rightLeft = 60;
    const rightWidth = 40;

    const baseSlot = Math.floor(100 / rightCount);
    let accum = 0;
    for (let i = 0; i < rightCount; i++) {
        const idx = 2 + i;
        const h = i === rightCount - 1 ? 100 - accum : baseSlot;
        addTile(panels[idx], accum, rightLeft, rightWidth, h);
        accum += h;
    }

    return out;
}
