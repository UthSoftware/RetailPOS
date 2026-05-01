const svc = require('../services/areaService');
const { generateAreaCode } = require('../utils/codeGenerator');

// ── GET ALL ─────────────────────────────
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
};

// ── NEXT CODE ───────────────────────────
exports.nextCode = async (req, res, next) => {
  try {
    const code = await generateAreaCode();
    res.json({ success: true, code });
  } catch (e) {
    next(e);
  }
};

// ── GET ONE ─────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// ── CREATE ─────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { a_cityid, a_areanameen, a_areanamereg, a_pincode, a_active } = req.body;

    if (!a_areanameen) {
      return res.status(400).json({ success: false, message: "Area name required" });
    }

    if (!a_cityid) {
      return res.status(400).json({ success: false, message: "City ID required" });
    }

    const code = await generateAreaCode();

    const row = await svc.insert({
      code,
      cityid: a_cityid,
      nameen: a_areanameen,
      namereg: a_areanamereg,
      pin: a_pincode,
      active: a_active,
    });

    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// ── UPDATE ─────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { a_cityid, a_areanameen, a_areanamereg, a_pincode, a_active } = req.body;

    const row = await svc.update(req.params.recid, {
      cityid: a_cityid,
      nameen: a_areanameen,
      namereg: a_areanamereg,
      pin: a_pincode,
      active: a_active,
    });

    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// ── DELETE ─────────────────────────────
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);

    res.json({
      success: true,
      message: "Area deleted",
    });
  } catch (e) {
    next(e);
  }
};

// ── TOGGLE ─────────────────────────────
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

//--------Bulk Delete------------------------------
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;

    // simple loop delete (or service bulk delete if you add)
    for (const id of recids) {
      await svc.deleteOne(id);
    }

    res.json({
      success: true,
      message: `${recids.length} record(s) deleted`,
    });
  } catch (e) {
    next(e);
  }
};

