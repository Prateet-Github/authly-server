import express from 'express';
import healthRoute from './routes/health.route.js';
import cors from 'cors';
import userRoute from './routes/auth.route.js';
import emailRoute from './routes/email.route.js';
import passwordRoute from './routes/password.route.js';
import sessionRoute from './routes/session.route.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', healthRoute);
app.use('/api/auth', userRoute);
app.use('/api/auth', emailRoute);
app.use('/api/auth', passwordRoute);
app.use('/api/auth', sessionRoute);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;