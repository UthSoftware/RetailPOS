const svc = require('../services/sysmodule.service');

// GET /api/sys-modules
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};

// GET /api/sys-modules/all  (simple list for dropdowns)
exports.getAll = async (req, res, next) => {
  try {
    const rows = await svc.getAllModules();
    res.json({ success: true, rows });
  } catch (e) { next(e); }
};

// GET /api/sys-modules/:recid
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);
    if (!row) return res.status(404).json({ success: false, message: 'Module not found' });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// POST /api/sys-modules
exports.create = async (req, res, next) => {
  try {
    const row = await svc.insert({
      nameen:  req.body.m_nameen,
      namereg: req.body.m_namereg || null,
      active:  req.body.m_active,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) { next(e); }
};

// PUT /api/sys-modules/:recid
exports.update = async (req, res, next) => {
  try {
    const row = await svc.update(req.params.recid, {
      nameen:  req.body.m_nameen,
      namereg: req.body.m_namereg || null,
      active:  req.body.m_active,
    });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// DELETE /api/sys-modules/:recid
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);
    res.json({ success: true, message: 'Module deleted' });
  } catch (e) { next(e); }
};

// POST /api/sys-modules/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;
    const count = await svc.bulkDelete(recids);
    res.json({ success: true, message: `${count} record(s) deleted` });
  } catch (e) { next(e); }
};

// PATCH /api/sys-modules/:recid/toggle
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};