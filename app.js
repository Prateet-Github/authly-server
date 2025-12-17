import express from 'express';
import healthRoute from './routes/health.route.js';
import cors from 'cors';
import userRoute from './routes/auth.route.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoute);
app.use('/api/auth', userRoute);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;