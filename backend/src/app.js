const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env" });

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("API Running 🚀"));
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ── Routes ─────────────────────────────────────────────────────────────────
const languageRoutes = require("./routes/language.routes");
const countryRoutes  = require("./routes/countryRoutes");

app.use("/api/languages", languageRoutes);
app.use("/api/country",   countryRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === '23505') return res.status(409).json({ success: false, message: 'Duplicate value — record already exists.' });
  if (err.code === '23503') return res.status(409).json({ success: false, message: 'Cannot delete — record is referenced by other data.' });
  if (err.code === '22P02') return res.status(400).json({ success: false, message: 'Invalid UUID format.' });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
