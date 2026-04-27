const router = require('express').Router();
const ctrl   = require('../controllers/countryController');

router.get('/next-code',        ctrl.nextCode);      // MUST be before /:recid
router.get('/',                 ctrl.fetchAll);
router.post('/bulk-delete',     ctrl.bulkDelete);    // POST to avoid /:recid conflict
router.get('/:recid',          ctrl.getOne);
router.post('/',                ctrl.create);
router.put('/:recid',          ctrl.update);
router.delete('/:recid',        ctrl.deleteOne);
router.patch('/:recid/toggle',  ctrl.toggleActive);

module.exports = router;
