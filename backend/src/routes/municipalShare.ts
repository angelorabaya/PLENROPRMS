import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * Municipal Share Summary interface with payment info
 */
interface MunicipalShareRecord {
    RptYear: number;
    aop_mun: string;
    total_share: number;
    paid_amount: number;
    balance: number;
}

/**
 * GET /api/municipal-share
 * Get municipal share summary filtered by year with payment data
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

        // Query with LEFT JOIN to get paid amounts from tbl_munpayment
        const result = await executeQuery<MunicipalShareRecord>(
            `SELECT 
                v.[RptYear],
                v.[aop_mun],
                v.[total_share],
                ISNULL(p.paid_amount, 0) as paid_amount,
                v.[total_share] - ISNULL(p.paid_amount, 0) as balance
            FROM View_munshareyear v
            LEFT JOIN (
                SELECT 
                    ms_year,
                    ms_mun,
                    SUM(msamount) as paid_amount
                FROM tbl_munpayment
                WHERE ms_year = @year
                GROUP BY ms_year, ms_mun
            ) p ON v.RptYear = p.ms_year 
                AND v.aop_mun = p.ms_mun
            WHERE v.RptYear = @year
            ORDER BY v.aop_mun`,
            { year }
        );

        res.json(successResponse(result.recordset));
    })
);

/**
 * GET /api/municipal-share/years
 * Get available years for the filter dropdown
 */
router.get(
    '/years',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ RptYear: number }>(
            `SELECT DISTINCT [RptYear] 
             FROM View_munshareyear 
             ORDER BY RptYear DESC`
        );

        const years = result.recordset.map(r => r.RptYear);
        res.json(successResponse(years));
    })
);

/**
 * GET /api/municipal-share/summary
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
                COUNT(*) as totalMunicipalities,
                SUM(total_share) as totalShare
             FROM View_munshareyear
             WHERE RptYear = @year`,
            { year }
        );

        const summaryData = result.recordset[0] as { totalMunicipalities: number; totalShare: number } | undefined;

        res.json(successResponse({
            year,
            totalMunicipalities: summaryData?.totalMunicipalities || 0,
            totalShare: summaryData?.totalShare || 0,
        }));
    })
);

/**
 * GET /api/municipal-share/monthly
 * Get monthly share breakdown for a specific municipality
 */
router.get(
    '/monthly',
    [
        query('year').isInt({ min: 2000, max: 2100 }),
        query('municipality').isString().notEmpty(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(req.query.year as string, 10);
        const municipality = req.query.municipality as string;

        const result = await executeQuery<{ mo: string; share: number }>(
            `SELECT mo, share
             FROM View_munsharemonth
             WHERE yr = @year 
               AND aop_mun = @municipality
             ORDER BY 
                CASE mo
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
            { year, municipality }
        );

        res.json(successResponse(result.recordset));
    })
);

export default router;
