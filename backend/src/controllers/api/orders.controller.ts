import { Request, Response } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';
import { subject } from '@casl/ability';

/**
 * List orders (filtered by permissions)
 * GET /api/orders
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Order')) {
    throw new ForbiddenError('Insufficient permissions to view orders');
  }

  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // Build where clause based on permissions
  // If user can manage all, show all orders
  // Otherwise, filter by userId
  const where: any = {};

  // Check if user can read all orders (no conditions)
  const canReadAll = req.ability?.can('read', 'Order');
  const canReadOwn = req.user && req.ability?.can('read', subject('Order', { userId: req.user.id }));

  if (!canReadAll && canReadOwn && req.user) {
    // Can only read own orders
    where.userId = req.user.id;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    data: orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get single order
 * GET /api/orders/:id
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check permission for this specific order
  if (!req.ability?.can('read', subject('Order', order))) {
    throw new ForbiddenError('Insufficient permissions to view this order');
  }

  res.json({ data: order });
});

/**
 * Create new order
 * POST /api/orders
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('create', 'Order')) {
    throw new ForbiddenError('Insufficient permissions to create order');
  }

  if (!req.user) {
    throw new ForbiddenError('User must be authenticated to create order');
  }

  const { items, notes } = req.body;

  if (!items || items.length === 0) {
    throw new BadRequestError('Order must have at least one item');
  }

  // Calculate total amount
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw new NotFoundError(`Product ${item.productId} not found`);
    }

    if (!product.isActive) {
      throw new BadRequestError(`Product ${product.name} is not available`);
    }

    if (product.stock < item.quantity) {
      throw new BadRequestError(`Insufficient stock for ${product.name}`);
    }

    const itemTotal = product.price.toNumber() * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    });
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order with items
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user.id,
      totalAmount,
      notes,
      status: 'PENDING',
      items: {
        create: orderItems,
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // Update product stock
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  }

  res.status(201).json({
    message: 'Order created successfully',
    data: order,
  });
});

/**
 * Update order
 * PUT /api/orders/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  const existingOrder = await prisma.order.findUnique({
    where: { id: req.params.id },
  });

  if (!existingOrder) {
    throw new NotFoundError('Order not found');
  }

  // Check permission for this specific order
  if (!req.ability?.can('update', subject('Order', existingOrder))) {
    throw new ForbiddenError('Insufficient permissions to update this order');
  }

  const { notes, status } = req.body;

  // Determine which fields user can update based on permissions
  const updateData: any = {};

  if (notes !== undefined) {
    // Check if user can update notes field
    const canUpdateNotes = req.ability?.can('update', subject('Order', existingOrder), 'notes');
    if (canUpdateNotes) {
      updateData.notes = notes;
    } else {
      throw new ForbiddenError('Insufficient permissions to update notes');
    }
  }

  if (status !== undefined) {
    // Check if user can update status field
    const canUpdateStatus = req.ability?.can('update', subject('Order', existingOrder), 'status');
    if (canUpdateStatus) {
      updateData.status = status;
    } else {
      throw new ForbiddenError('Insufficient permissions to update status');
    }
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res.json({
    message: 'Order updated successfully',
    data: order,
  });
});

/**
 * Delete order
 * DELETE /api/orders/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
  });

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!req.ability?.can('delete', subject('Order', order))) {
    throw new ForbiddenError('Insufficient permissions to delete this order');
  }

  await prisma.order.delete({
    where: { id: req.params.id },
  });

  res.json({
    message: 'Order deleted successfully',
  });
});
