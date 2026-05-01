const router = require("express").Router();
const ctrl = require("../controllers/cityController");

// IMPORTANT: keep specific routes BEFORE /:recid

// NEXT CODE
router.get("/next-code", ctrl.nextCode);

// GET ALL
router.get("/", ctrl.fetchAll);

// BULK DELETE (same as state/country if needed)
router.post("/bulk-delete", ctrl.bulkDelete);

// GET ONE
router.get("/:recid", ctrl.getOne);

// CREATE
router.post("/", ctrl.create);

// UPDATE
router.put("/:recid", ctrl.update);

// DELETE
router.delete("/:recid", ctrl.deleteOne);

// TOGGLE ACTIVE
router.patch("/:recid/toggle", ctrl.toggleActive);

module.exports = router;