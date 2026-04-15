import { Router, Request, Response } from 'express';
import { executeQuery, testConnection } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * GET /api/dashboard
 * Get dashboard statistics
 */
router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
        // Total permits
        const permitsResult = await executeQuery<{ total: number; pending: number }>(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM Permits`
        );

        // Total collections
        const collectionsResult = await executeQuery<{ total: number }>(
            `SELECT SUM(amount) as total FROM PaymentCollections`
        );

        // Barangay share
        const barangayResult = await executeQuery<{ total: number }>(
            `SELECT SUM(barangayShare) as total FROM Permits`
        );

        // Municipal share
        const municipalResult = await executeQuery<{ total: number }>(
            `SELECT SUM(municipalShare) as total FROM Permits`
        );

        // Recent collections (last 5)
        const recentResult = await executeQuery(
            `SELECT TOP 5 * FROM PaymentCollections 
       ORDER BY paymentDate DESC`
        );

        res.json(successResponse({
            totalPermits: permitsResult.recordset[0]?.total || 0,
            pendingPermits: permitsResult.recordset[0]?.pending || 0,
            totalCollections: collectionsResult.recordset[0]?.total || 0,
            barangayShare: barangayResult.recordset[0]?.total || 0,
            municipalShare: municipalResult.recordset[0]?.total || 0,
            recentCollections: recentResult.recordset,
        }));
    })
);

/**
 * GET /api/dashboard/health
 * Health check endpoint
 */
router.get(
    '/health',
    asyncHandler(async (_req: Request, res: Response) => {
        const dbConnected = await testConnection();
        let timestamp = '';
        if (dbConnected) {
            const result = await executeQuery<{ dt: string }>(
                `SELECT CONVERT(varchar(23), DATEADD(hour, 8, GETUTCDATE()), 126) + '+08:00' as dt`
            );
            timestamp = result.recordset[0]?.dt || '';
        }

        res.json(successResponse({
            status: 'ok',
            timestamp: timestamp || new Date().toISOString(), // keep fallback just in case DB is down
            database: dbConnected ? 'connected' : 'disconnected',
        }));
    })
);

/**
 * GET /api/dashboard/active-permits
 * Get total count of active permits
 */
router.get(
    '/active-permits',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ TotalRecords: number }>(
            `SELECT COUNT(*) AS TotalRecords FROM View_activepermit`
        );

        res.json(successResponse({
            totalActivePermits: result.recordset[0]?.TotalRecords || 0,
        }));
    })
);

/**
 * GET /api/dashboard/total-collections
 * Get total collections for the current year
 */
router.get(
    '/total-collections',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ TotalCollection: number }>(
            `SELECT 
                SUM(aop_total) AS TotalCollection
            FROM 
                dbo.tbl_assessmenthdr
            WHERE 
                aop_orno IS NOT NULL
                AND aop_ordate >= DATEFROMPARTS(YEAR(DATEADD(hour, 8, GETUTCDATE())), 1, 1) 
                AND aop_ordate < DATEFROMPARTS(YEAR(DATEADD(hour, 8, GETUTCDATE())) + 1, 1, 1)`
        );

        res.json(successResponse({
            totalCollections: result.recordset[0]?.TotalCollection || 0,
        }));
    })
);

/**
 * GET /api/dashboard/barangay-share
 * Get total barangay share for the current year
 */
router.get(
    '/barangay-share',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ BrgyShare: number }>(
            `SELECT SUM(total_share) AS BrgyShare
             FROM View_brgysharesyear
             WHERE RptYear = YEAR(DATEADD(hour, 8, GETUTCDATE()))`
        );

        res.json(successResponse({
            barangayShare: result.recordset[0]?.BrgyShare || 0,
        }));
    })
);

/**
 * GET /api/dashboard/municipal-share
 * Get total municipal share for the current year
 */
router.get(
    '/municipal-share',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ MunShare: number }>(
            `SELECT SUM(total_share) AS MunShare
             FROM View_munshareyear
             WHERE RptYear = YEAR(DATEADD(hour, 8, GETUTCDATE()))`
        );

        res.json(successResponse({
            municipalShare: result.recordset[0]?.MunShare || 0,
        }));
    })
);

/**
 * GET /api/dashboard/gross-collections
 * Get monthly collection statistics for current and previous year
 */
router.get(
    '/gross-collections',
    asyncHandler(async (_req: Request, res: Response) => {
        const yearResult = await executeQuery<{ yr: number }>(`SELECT YEAR(DATEADD(hour, 8, GETUTCDATE())) as yr`);
        const currentYear = yearResult.recordset[0]?.yr || new Date().getFullYear();
        const previousYear = currentYear - 1;

        const result = await executeQuery<{ yr: number; mo: number; total: number }>(
            `SELECT yr, mo, total
             FROM View_gross
             WHERE yr IN (${currentYear}, ${previousYear})
             ORDER BY yr, mo`
        );

        res.json(successResponse({
            currentYear,
            previousYear,
            data: result.recordset,
        }));
    })
);

export default router;
