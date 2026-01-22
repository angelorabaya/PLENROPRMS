import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate, ApiError } from '../middleware/index.js';
import {
    successResponse,
    paginatedResponse,
    parsePagination
} from '../utils/index.js';
import type { Permit } from '../types/index.js';

const router = Router();

/**
 * GET /api/permits
 * Get all permits with pagination
 */
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('status').optional().isIn(['pending', 'approved', 'rejected', 'expired']),
        query('barangay').optional().isString(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, offset } = parsePagination(
            req.query.page as string,
            req.query.limit as string
        );
        const status = req.query.status as string;
        const barangay = req.query.barangay as string;

        // Build WHERE clause
        const conditions: string[] = [];
        const params: Record<string, unknown> = {};

        if (status) {
            conditions.push('status = @status');
            params.status = status;
        }
        if (barangay) {
            conditions.push('barangay = @barangay');
            params.barangay = barangay;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // Get total count
        const countResult = await executeQuery<{ total: number }>(
            `SELECT COUNT(*) as total FROM Permits ${whereClause}`,
            params
        );
        const total = countResult.recordset[0]?.total || 0;

        // Get paginated data
        const dataResult = await executeQuery<Permit>(
            `SELECT * FROM Permits ${whereClause}
       ORDER BY createdAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
            { ...params, offset, limit }
        );

        res.json(paginatedResponse(dataResult.recordset, page, limit, total));
    })
);

/**
 * GET /api/permits/:id
 * Get a single permit by ID
 */
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const result = await executeQuery<Permit>(
            'SELECT * FROM Permits WHERE id = @id',
            { id: parseInt(id, 10) }
        );

        if (result.recordset.length === 0) {
            throw new ApiError(404, 'Permit not found');
        }

        res.json(successResponse(result.recordset[0]));
    })
);

/**
 * GET /api/permits/summary/barangay
 * Get barangay share summary
 */
router.get(
    '/summary/barangay',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        let dateFilter = '';
        const params: Record<string, unknown> = {};

        if (startDate && endDate) {
            dateFilter = 'WHERE issueDate BETWEEN @startDate AND @endDate';
            params.startDate = startDate;
            params.endDate = endDate;
        }

        const result = await executeQuery(
            `SELECT 
        barangay as barangayName,
        COUNT(*) as totalPermits,
        SUM(amount) as totalAmount,
        SUM(barangayShare) as totalShare
       FROM Permits
       ${dateFilter}
       GROUP BY barangay
       ORDER BY totalShare DESC`,
            params
        );

        res.json(successResponse(result.recordset));
    })
);

/**
 * GET /api/permits/summary/municipal
 * Get municipal share summary
 */
router.get(
    '/summary/municipal',
    [
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        let dateFilter = '';
        const params: Record<string, unknown> = {};

        if (startDate && endDate) {
            dateFilter = 'WHERE issueDate BETWEEN @startDate AND @endDate';
            params.startDate = startDate;
            params.endDate = endDate;
        }

        // Overall summary
        const summaryResult = await executeQuery(
            `SELECT 
        COUNT(*) as totalPermits,
        SUM(amount) as totalAmount,
        SUM(municipalShare) as totalShare
       FROM Permits
       ${dateFilter}`,
            params
        );

        // By permit type
        const byTypeResult = await executeQuery(
            `SELECT 
        permitType,
        COUNT(*) as count,
        SUM(amount) as amount,
        SUM(municipalShare) as share
       FROM Permits
       ${dateFilter}
       GROUP BY permitType
       ORDER BY share DESC`,
            params
        );

        res.json(successResponse({
            ...(summaryResult.recordset[0] as Record<string, unknown>),
            byPermitType: byTypeResult.recordset,
        }));
    })
);

export default router;
