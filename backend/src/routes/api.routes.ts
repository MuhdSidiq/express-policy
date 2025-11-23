import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ordersController from '../controllers/api/orders.controller';
import * as productsController from '../controllers/api/products.controller';

const router = Router();

// All API routes require authentication
router.use(requireAuth);

// ============================================
// ORDERS
// ============================================

router.get('/orders', ordersController.list);
router.post('/orders', ordersController.create);
router.get('/orders/:id', ordersController.getOne);
router.put('/orders/:id', ordersController.update);
router.delete('/orders/:id', ordersController.remove);

// ============================================
// PRODUCTS
// ============================================

router.get('/products', productsController.list);
router.post('/products', productsController.create);
router.get('/products/:id', productsController.getOne);
router.put('/products/:id', productsController.update);
router.delete('/products/:id', productsController.remove);

export default router;
