const { snapshotPublisher } = require("../utils/snapshotPublisher");

exports.getHealth = (req, res) =>
  res.status(200).json({
    success: true,
    data: { status: "ok", uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() },
  });

exports.getPublicSnapshot = async (req, res) => {
  try {
    const snapshot = await snapshotPublisher.getSnapshot();
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    console.error("getPublicSnapshot error:", error);
    return res.status(503).json({ success: false, message: "Snapshot is not available right now" });
  }
};

exports.publishSnapshot = async (req, res) => {
  try {
    const result = await snapshotPublisher.publish({ force: req.query.force === "true" });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("publishSnapshot error:", error);
    return res.status(502).json({ success: false, message: "Snapshot publish failed" });
  }
};

exports.getSnapshotStatus = (req, res) =>
  res.status(200).json({ success: true, data: snapshotPublisher.status() });
