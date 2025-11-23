import { Request, Response } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

/**
 * List products
 * GET /api/products
 */
export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Product')) {
    throw new ForbiddenError('Insufficient permissions to view products');
  }

  const { page = 1, limit = 50, search, isActive } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { sku: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: Number(limit),
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Get single product
 * GET /api/products/:id
 */
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('read', 'Product')) {
    throw new ForbiddenError('Insufficient permissions to view product');
  }

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
  });

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.json({ data: product });
});

/**
 * Create new product (admin only)
 * POST /api/products
 */
export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('create', 'Product')) {
    throw new ForbiddenError('Insufficient permissions to create product');
  }

  const product = await prisma.product.create({
    data: req.body,
  });

  res.status(201).json({
    message: 'Product created successfully',
    data: product,
  });
});

/**
 * Update product
 * PUT /api/products/:id
 */
export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('update', 'Product')) {
    throw new ForbiddenError('Insufficient permissions to update product');
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    message: 'Product updated successfully',
    data: product,
  });
});

/**
 * Delete product (soft delete)
 * DELETE /api/products/:id
 */
export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.ability?.can('delete', 'Product')) {
    throw new ForbiddenError('Insufficient permissions to delete product');
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({
    message: 'Product deactivated successfully',
    data: product,
  });
});
