import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    statusCode: number;
    errors?: ValidationError[];

    constructor(statusCode: number, message: string, errors?: ValidationError[]) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'ApiError';
    }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: Error | ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('❌ Error:', err.message);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    // Handle SQL Server errors
    if (err.name === 'ConnectionError') {
        return res.status(503).json({
            success: false,
            message: 'Database connection error. Please try again later.',
        });
    }

    if (err.name === 'RequestError') {
        return res.status(400).json({
            success: false,
            message: 'Database request error.',
        });
    }

    // Default error response
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
};

/**
 * Not found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
};

/**
 * Validation middleware - checks express-validator results
 */
export const validate = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
    }

    next();
};
