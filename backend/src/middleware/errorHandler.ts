import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || [];
      res.status(409).json({
        error: `A record with this ${target.join(', ')} already exists.`,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'The requested resource was not found.',
      });
      return;
    }
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
}
