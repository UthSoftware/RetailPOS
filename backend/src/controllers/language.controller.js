const service = require("../services/language.service");

// ✅ GET
exports.getLanguages = async (req, res) => {
  try {
    const data = await service.getAllLanguages();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ CREATE
exports.createLanguage = async (req, res) => {
  try {
    const data = await service.createLanguage(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ UPDATE
exports.updateLanguage = async (req, res) => {
  try {
    const data = await service.updateLanguage(req.params.id, req.body);

    if (!data) {
      return res.status(404).json({ message: "Language not found" });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ DELETE
exports.deleteLanguage = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await service.deleteLanguage(id);

    if (!result) {
      return res.status(404).json({ message: "Language not found" });
    }

    res.status(200).json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

