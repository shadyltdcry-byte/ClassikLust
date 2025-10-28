import express from 'express';
import { registerUserRoutes } from './routes/userRoutes';
import { registerTapRoutes } from './routes/tapRoutes';
import mediaRoutes from './routes/gameExtrasRoutes';
import { registerMediaRoutes } from './routes/mediaRoutes';

const app = express();
app.use(express.json({ limit: '10mb' }));

registerUserRoutes(app);
registerTapRoutes(app);
registerMediaRoutes(app);
app.use(mediaRoutes);

export default app;