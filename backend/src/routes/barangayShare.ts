import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * Barangay Share Summary interface with payment info
 */
interface BarangayShareRecord {
    RptYear: number;
    aop_mun: string;
    aop_brgy: string;
    total_share: number;
    paid_amount: number;
    balance: number;
}

/**
 * GET /api/barangay-share
 * Get barangay share summary filtered by year with payment data
 */
router.get(
    '/',
    [
        query('year').optional().isInt({ min: 2000, max: 2100 }),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = req.query.year
            ? parseInt(req.query.year as string, 10)
            : new Date().getFullYear();

        // Query with LEFT JOIN to get paid amounts from tbl_brgypayment
        const result = await executeQuery<BarangayShareRecord>(
            `SELECT 
                v.[RptYear],
                v.[aop_mun],
                v.[aop_brgy],
                v.[total_share],
                ISNULL(p.paid_amount, 0) as paid_amount,
                v.[total_share] - ISNULL(p.paid_amount, 0) as balance
            FROM View_brgysharesyear v
            LEFT JOIN (
                SELECT 
                    bs_year,
                    bs_mun,
                    bs_brgy,
                    SUM(bsamount) as paid_amount
                FROM tbl_brgypayment
                WHERE bs_year = @year
                GROUP BY bs_year, bs_mun, bs_brgy
            ) p ON v.RptYear = p.bs_year 
                AND v.aop_mun = p.bs_mun 
                AND v.aop_brgy = p.bs_brgy
            WHERE v.RptYear = @year
            ORDER BY v.aop_mun, v.aop_brgy`,
            { year }
        );

        res.json(successResponse(result.recordset));
    })
);

/**
 * GET /api/barangay-share/years
 * Get available years for the filter dropdown
 */
router.get(
    '/years',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ RptYear: number }>(
            `SELECT DISTINCT [RptYear] 
       FROM View_brgysharesyear 
       ORDER BY RptYear DESC`
        );

        const years = result.recordset.map(r => r.RptYear);
        res.json(successResponse(years));
    })
);

/**
 * GET /api/barangay-share/summary
 * Get summary totals by year
 */
router.get(
    '/summary',
    [
        query('year').optional().isInt({ min: 2000, max: 2100 }),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = req.query.year
            ? parseInt(req.query.year as string, 10)
            : new Date().getFullYear();

        const result = await executeQuery(
            `SELECT 
        COUNT(*) as totalBarangays,
        SUM(total_share) as totalShare
       FROM View_brgysharesyear
       WHERE RptYear = @year`,
            { year }
        );

        const summaryData = result.recordset[0] as { totalBarangays: number; totalShare: number } | undefined;

        res.json(successResponse({
            year,
            totalBarangays: summaryData?.totalBarangays || 0,
            totalShare: summaryData?.totalShare || 0,
        }));
    })
);

/**
 * GET /api/barangay-share/monthly
 * Get monthly share breakdown for a specific barangay
 */
router.get(
    '/monthly',
    [
        query('year').isInt({ min: 2000, max: 2100 }),
        query('municipality').isString().notEmpty(),
        query('barangay').isString().notEmpty(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(req.query.year as string, 10);
        const municipality = req.query.municipality as string;
        const barangay = req.query.barangay as string;

        const result = await executeQuery<{ MonthName: string; total_share: number }>(
            `SELECT MonthName, total_share
             FROM View_brgysharesmonth
             WHERE RptYear = @year 
               AND aop_mun = @municipality 
               AND aop_brgy = @barangay
             ORDER BY 
                CASE MonthName
                    WHEN 'January' THEN 1
                    WHEN 'February' THEN 2
                    WHEN 'March' THEN 3
                    WHEN 'April' THEN 4
                    WHEN 'May' THEN 5
                    WHEN 'June' THEN 6
                    WHEN 'July' THEN 7
                    WHEN 'August' THEN 8
                    WHEN 'September' THEN 9
                    WHEN 'October' THEN 10
                    WHEN 'November' THEN 11
                    WHEN 'December' THEN 12
                END`,
            { year, municipality, barangay }
        );

        res.json(successResponse(result.recordset));
    })
);

export default router;
