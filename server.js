const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

// Import routes
const router = require('./routes/index');

// Use routes
app.use(express.json());
router(app);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
