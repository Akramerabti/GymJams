// server.js
const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'https://frontend.gymjams.ca',
    'https://gymjams.ca',
    'http://localhost:3000' // For development
  ]
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});