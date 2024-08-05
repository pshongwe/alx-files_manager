import express from 'express';
import routeControl from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Use routes
app.use(express.json());
routeControl(app);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
