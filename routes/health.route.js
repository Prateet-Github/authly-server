import {Router} from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({status: 'OK', service: 'authly'});
});

export default router;