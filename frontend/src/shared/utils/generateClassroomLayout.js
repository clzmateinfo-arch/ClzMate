// frontend/src/shared/utils/generateClassroomLayout.js
export function generateClassroomLayout({
    features = { sandboxEnabled: false, notesEnabled: true },
    hasExternal = false,
    hasVideo = false,
    hasPdf = false,
    sectionWidth = 16,
} = {}) {
    const panels = [];

    if (hasExternal) panels.push({ id: "external", type: "external" });
    if (hasVideo) panels.push({ id: "video", type: "video" });
    if (hasPdf) panels.push({ id: "pdf", type: "pdf" });

    panels.push({ id: "assignments", type: "assignments" });
    panels.push({ id: "materials", type: "materials" });
    panels.push({ id: "quizzes", type: "quizzes" });
    panels.push({ id: "attachments", type: "attachments" });

    if (features.notesEnabled) panels.push({ id: "notes", type: "notes" });
    if (features.sandboxEnabled) panels.push({ id: "sandbox", type: "sandbox" });

    // dedupe by id preserving order
    const seen = new Set();
    const uniqPanels = [];
    for (const p of panels) {
        if (!seen.has(p.id)) {
            seen.add(p.id);
            uniqPanels.push(p);
        }
    }

    const contentWidth = Math.max(0, 100 - sectionWidth);
    const out = [];

    out.push({
        id: "topics",
        title: "Topics",
        top: 0,
        left: 0,
        width: sectionWidth,
        height: 100,
    });

    // section sidebar area (occupies left of content area)
    out.push({
        id: "sections",
        title: "Sections",
        top: 0,
        left: sectionWidth,
        width: 8,
        height: 100,
    });

    const pcount = uniqPanels.length;
    const addTile = (id, relTopPct, relLeftPct, relWpct, relHpct, title, type) => {
        out.push({
            id,
            title: title || id,
            type: type || id,
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
        addTile(uniqPanels[0].id, 0, 8, 92, 100);
        return out;
    }

    // For up to 4 panels arrange in grid
    if (pcount === 2) {
        addTile(uniqPanels[0].id, 0, 8, 92, 60);
        addTile(uniqPanels[1].id, 60, 8, 92, 40);
        return out;
    }
    if (pcount === 3) {
        addTile(uniqPanels[0].id, 0, 8, 62, 100);
        addTile(uniqPanels[1].id, 0, 70, 30, 50);
        addTile(uniqPanels[2].id, 50, 70, 30, 50);
        return out;
    }
    if (pcount === 4) {
        addTile(uniqPanels[0].id, 0, 8, 46, 50);
        addTile(uniqPanels[1].id, 0, 54, 46, 50);
        addTile(uniqPanels[2].id, 50, 8, 46, 50);
        addTile(uniqPanels[3].id, 50, 54, 46, 50);
        return out;
    }

    // 5+ panels: main area takes left 60% and right columns stacked
    addTile(uniqPanels[0].id, 0, 8, 60, 50);
    addTile(uniqPanels[1].id, 50, 8, 60, 50);
    const rightCount = Math.max(1, pcount - 2);
    const rightLeft = 68;
    const slotH = Math.floor(100 / rightCount);
    let accum = 0;
    for (let i = 0; i < rightCount; i++) {
        const idx = 2 + i;
        const h = i === rightCount - 1 ? 100 - accum : slotH;
        addTile(uniqPanels[idx].id, accum, rightLeft, 32, h);
        accum += h;
    }

    return out;
}
