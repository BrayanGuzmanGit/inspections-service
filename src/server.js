const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

const inspectionRoutes = require('./modules/inspections/inspectionRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Inspections Service is up' });
});

app.use('/api/inspections', inspectionRoutes);

app.use(errorHandler);
module.exports = app;
