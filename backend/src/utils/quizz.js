function evaluateScreenAnswer(screen = {}, provided = null, timeTaken = 0) {
    const props = (screen.properties || {});
    const base = Number(props.points || 0) || 0;
    const timeLimit = Number(props.timeLimit || 0) || 0;
    const answerMode = props.answerMode || "single";
    let correct = false;

    const normProvided = (() => {
        if (Array.isArray(provided)) return provided.map(String);
        if (provided === null || provided === undefined) return provided;
        return String(provided);
    })();

    const type = (screen.type || "multiple").toString().toLowerCase();

    if (type === "multiple" || type === "truefalse") {
        const correctIds = (screen.options || [])
            .map((opt, i) => (opt && opt.correct ? String(i) : null))
            .filter(Boolean);

        if (answerMode === "multiple") {
            const providedIds = Array.isArray(normProvided) ? normProvided : (normProvided ? [normProvided] : []);
            if (providedIds.length > 0 && providedIds.length === correctIds.length) {
                correct = providedIds.every((id) => correctIds.includes(String(id)));
            } else {
                correct = false;
            }
        } else {
            if (normProvided === null || normProvided === undefined) {
                correct = false;
            } else {
                correct = correctIds.includes(String(normProvided));
            }
        }
    } else if (type === "short") {
        const expected = (screen.options || [])
            .map((o) => (o && o.text ? String(o.text).trim().toLowerCase() : ""))
            .filter(Boolean);
        const resp = (normProvided || "").toString().trim().toLowerCase();
        correct = expected.length === 0 ? false : expected.includes(resp);
    } else if (type === "slider") {
        const targetOpt = (screen.options && screen.options[0]) ? screen.options[0] : null;
        const target = targetOpt ? (targetOpt.value !== undefined ? Number(targetOpt.value) : (targetOpt.text !== undefined ? Number(targetOpt.text) : null)) : null;
        const val = Number(normProvided);
        if (target === null || Number.isNaN(target)) {
            correct = true;
        } else {
            correct = !Number.isNaN(val) && (Math.abs(val - target) === 0);
        }
    } else if (type === "poll") {
        correct = false;
    } else {
        correct = false;
    }

    const timeBonus = timeLimit > 0
        ? Math.round(base * ((Math.max(0, timeLimit - Number(timeTaken || 0)) / timeLimit) * 0.5))
        : 0;

    const pointsEarned = correct ? (base + timeBonus) : 0;

    return {
        correct: !!correct,
        pointsEarned: Number(pointsEarned || 0),
        base: Number(base || 0),
        timeTaken: Number(timeTaken || 0),
        timeBonus: Number(timeBonus || 0),
    };
}

module.exports = {
    evaluateScreenAnswer,
};
