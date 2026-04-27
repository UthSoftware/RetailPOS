require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const countryRoutes = require('./routes/countryRoutes');

const app  = express();
const PORT = process.env.PORT || 5003;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes — Country only
app.use('/api/country', countryRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.code === '23505') return res.status(409).json({ success: false, message: 'Duplicate value — record already exists.' });
  if (err.code === '23503') return res.status(409).json({ success: false, message: 'Cannot delete — record is referenced by other data.' });
  if (err.code === '22P02') return res.status(400).json({ success: false, message: 'Invalid UUID format.' });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`✅  API running on http://localhost:${PORT}`);
});

module.exports = app;