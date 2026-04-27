const svc  = require('../services/countryService');
const { generateCountryCode } = require('../utils/codeGenerator');

// GET /api/country?search=&active=&page=&limit=&sortBy=&sortDir=
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};

// GET /api/country/next-code
exports.nextCode = async (req, res, next) => {
  try {
    const code = await generateCountryCode();
    res.json({ success: true, code });
  } catch (e) { next(e); }
};

// GET /api/country/:recid
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);
    if (!row) return res.status(404).json({ success: false, message: 'Country not found' });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// POST /api/country
exports.create = async (req, res, next) => {
  try {
    console.log('[CREATE] body:', req.body);
    const code = await generateCountryCode();
    const row  = await svc.insert({
      code,
      nameen:  req.body.con_nameen,
      namereg: req.body.con_namereg  || null,
      isdcode: req.body.con_isdcode,
      active:  req.body.con_active,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) { next(e); }
};

// PUT /api/country/:recid
exports.update = async (req, res, next) => {
  try {
    console.log('[UPDATE] body:', req.body);
    const row = await svc.update(req.params.recid, {
      nameen:  req.body.con_nameen,
      namereg: req.body.con_namereg || null,
      isdcode: req.body.con_isdcode,
      active:  req.body.con_active,
    });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// DELETE /api/country/:recid
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);
    res.json({ success: true, message: 'Country deleted' });
  } catch (e) { next(e); }
};

// POST /api/country/bulk-delete   body: { recids: [uuid, ...] }
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;
    const count = await svc.bulkDelete(recids);
    res.json({ success: true, message: `${count} record(s) deleted` });
  } catch (e) { next(e); }
};

// PATCH /api/country/:recid/toggle
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};
