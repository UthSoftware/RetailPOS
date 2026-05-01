const svc = require('../services/sysForm.service');

// GET /api/sys-forms
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};

// GET /api/sys-forms/next-code
exports.nextCode = async (req, res, next) => {
  try {
    const code = await svc.nextCode();
    res.json({ success: true, code });
  } catch (e) { next(e); }
};

// GET /api/sys-forms/tables  (dropdown list)
exports.getTables = async (req, res, next) => {
  try {
    const rows = await svc.getAllTables();
    res.json({ success: true, rows });
  } catch (e) { next(e); }
};

// GET /api/sys-forms/modules  (dropdown list)
exports.getModules = async (req, res, next) => {
  try {
    const rows = await svc.getAllModules();
    res.json({ success: true, rows });
  } catch (e) { next(e); }
};

// GET /api/sys-forms/:recid
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);
    if (!row) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// POST /api/sys-forms
exports.create = async (req, res, next) => {
  try {
    const code = await svc.nextCode();
    const row  = await svc.insert({
      code,
      formname: req.body.sf_formname,
      tableid:  req.body.sf_primarytableid || null,
      moduleid: req.body.sf_moduleid       || null,
      active:   req.body.sf_active,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) { next(e); }
};

// PUT /api/sys-forms/:recid
exports.update = async (req, res, next) => {
  try {
    const row = await svc.update(req.params.recid, {
      formname: req.body.sf_formname,
      tableid:  req.body.sf_primarytableid || null,
      moduleid: req.body.sf_moduleid       || null,
      active:   req.body.sf_active,
    });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// DELETE /api/sys-forms/:recid
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);
    res.json({ success: true, message: 'Form deleted' });
  } catch (e) { next(e); }
};

// POST /api/sys-forms/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;
    const count = await svc.bulkDelete(recids);
    res.json({ success: true, message: `${count} record(s) deleted` });
  } catch (e) { next(e); }
};

// PATCH /api/sys-forms/:recid/toggle
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};