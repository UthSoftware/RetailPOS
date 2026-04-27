const express = require("express");
const router = express.Router();
const controller = require("../controllers/language.controller");

router.get("/", controller.getLanguages);
router.post("/", controller.createLanguage);
router.put("/:id", controller.updateLanguage);
router.delete("/:id", controller.deleteLanguage);

module.exports = router;
