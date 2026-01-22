import { Router, Request, Response } from 'express';
import { query, body, param } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate, ApiError } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * Municipal Payment record interface
 */
interface MunicipalPaymentRecord {
    ms_ctrlno: string;
    ms_chkdate: Date | null;
    ms_chkno: string | null;
    ms_mun: string;
    ms_natureofpayment: string | null;
    ms_year: number;
    msamount: number;
    ms_claimedby: string | null;
    ms_claimeddate: Date | null;
    ms_datereturned: Date | null;
}

/**
 * GET /api/municipal-payment
 * Get payment details for a specific municipality filtered by year
 */
router.get(
    '/',
    [
        query('year').notEmpty().isInt({ min: 2000, max: 2100 }).withMessage('Year is required'),
        query('municipality').notEmpty().withMessage('Municipality is required'),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(req.query.year as string, 10);
        const municipality = req.query.municipality as string;

        const result = await executeQuery<MunicipalPaymentRecord>(
            `SELECT 
                [ms_ctrlno],
                [ms_chkdate],
                [ms_chkno],
                [ms_mun],
                [ms_natureofpayment],
                [ms_year],
                [msamount],
                [ms_claimedby],
                [ms_claimeddate],
                [ms_datereturned]
            FROM [tbl_munpayment]
            WHERE ms_year = @year 
                AND ms_mun = @municipality
            ORDER BY ms_chkdate DESC`,
            { year, municipality }
        );

        res.json(successResponse(result.recordset));
    })
);

/**
 * POST /api/municipal-payment
 * Create a new payment record
 */
router.post(
    '/',
    [
        body('ms_year').notEmpty().isInt({ min: 2000, max: 2100 }).withMessage('Year is required'),
        body('ms_mun').notEmpty().withMessage('Municipality is required'),
        body('msamount').notEmpty().isFloat({ min: 0 }).withMessage('Amount is required'),
        body('ms_natureofpayment').optional(),
        body('ms_chkdate').optional(),
        body('ms_chkno').optional(),
        body('ms_claimedby').optional(),
        body('ms_claimeddate').optional(),
        body('ms_datereturned').optional(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const {
            ms_year,
            ms_mun,
            msamount,
            ms_natureofpayment,
            ms_chkdate,
            ms_chkno,
            ms_claimedby,
            ms_claimeddate,
            ms_datereturned,
        } = req.body;

        const result = await executeQuery(
            `INSERT INTO [tbl_munpayment] (
                [ms_year],
                [ms_mun],
                [msamount],
                [ms_natureofpayment],
                [ms_chkdate],
                [ms_chkno],
                [ms_claimedby],
                [ms_claimeddate],
                [ms_datereturned]
            ) VALUES (
                @ms_year,
                @ms_mun,
                @msamount,
                @ms_natureofpayment,
                @ms_chkdate,
                @ms_chkno,
                @ms_claimedby,
                @ms_claimeddate,
                @ms_datereturned
            )`,
            {
                ms_year,
                ms_mun,
                msamount,
                ms_natureofpayment: ms_natureofpayment || null,
                ms_chkdate: ms_chkdate || null,
                ms_chkno: ms_chkno || null,
                ms_claimedby: ms_claimedby || null,
                ms_claimeddate: ms_claimeddate || null,
                ms_datereturned: ms_datereturned || null,
            }
        );

        if (result.rowsAffected[0] === 0) {
            throw new ApiError(500, 'Failed to create payment record');
        }

        res.status(201).json(successResponse(null, 'Payment record created successfully'));
    })
);

/**
 * PUT /api/municipal-payment/:ctrlno
 * Update an existing payment record
 */
router.put(
    '/:ctrlno',
    [
        param('ctrlno').notEmpty().withMessage('Control number is required'),
        body('msamount').optional().isFloat({ min: 0 }),
        body('ms_natureofpayment').optional(),
        body('ms_chkdate').optional(),
        body('ms_chkno').optional(),
        body('ms_claimedby').optional(),
        body('ms_claimeddate').optional(),
        body('ms_datereturned').optional(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { ctrlno } = req.params;
        const {
            msamount,
            ms_natureofpayment,
            ms_chkdate,
            ms_chkno,
            ms_claimedby,
            ms_claimeddate,
            ms_datereturned,
        } = req.body;

        const result = await executeQuery(
            `UPDATE [tbl_munpayment] SET
                [msamount] = COALESCE(@msamount, [msamount]),
                [ms_natureofpayment] = @ms_natureofpayment,
                [ms_chkdate] = @ms_chkdate,
                [ms_chkno] = @ms_chkno,
                [ms_claimedby] = @ms_claimedby,
                [ms_claimeddate] = @ms_claimeddate,
                [ms_datereturned] = @ms_datereturned
            WHERE [ms_ctrlno] = @ctrlno`,
            {
                ctrlno,
                msamount: msamount !== undefined ? msamount : null,
                ms_natureofpayment: ms_natureofpayment !== undefined ? ms_natureofpayment : null,
                ms_chkdate: ms_chkdate !== undefined ? ms_chkdate : null,
                ms_chkno: ms_chkno !== undefined ? ms_chkno : null,
                ms_claimedby: ms_claimedby !== undefined ? ms_claimedby : null,
                ms_claimeddate: ms_claimeddate !== undefined ? ms_claimeddate : null,
                ms_datereturned: ms_datereturned !== undefined ? ms_datereturned : null,
            }
        );

        if (result.rowsAffected[0] === 0) {
            throw new ApiError(404, 'Payment record not found');
        }

        res.json(successResponse(null, 'Payment record updated successfully'));
    })
);

/**
 * DELETE /api/municipal-payment/:ctrlno
 * Delete a payment record
 */
router.delete(
    '/:ctrlno',
    [
        param('ctrlno').notEmpty().withMessage('Control number is required'),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { ctrlno } = req.params;

        const result = await executeQuery(
            `DELETE FROM [tbl_munpayment] WHERE [ms_ctrlno] = @ctrlno`,
            { ctrlno }
        );

        if (result.rowsAffected[0] === 0) {
            throw new ApiError(404, 'Payment record not found');
        }

        res.json(successResponse(null, 'Payment record deleted successfully'));
    })
);

/**
 * GET /api/municipal-payment/summary
 * Get payment summary totals
 */
router.get(
    '/summary',
    [
        query('year').notEmpty().isInt({ min: 2000, max: 2100 }),
        query('municipality').notEmpty(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(req.query.year as string, 10);
        const municipality = req.query.municipality as string;

        const result = await executeQuery<{ totalPayments: number; totalAmount: number }>(
            `SELECT 
                COUNT(*) as totalPayments,
                ISNULL(SUM(msamount), 0) as totalAmount
            FROM [tbl_munpayment]
            WHERE ms_year = @year 
                AND ms_mun = @municipality`,
            { year, municipality }
        );

        const summaryData = result.recordset[0];

        res.json(successResponse({
            year,
            municipality,
            totalPayments: summaryData?.totalPayments || 0,
            totalAmount: summaryData?.totalAmount || 0,
        }));
    })
);

export default router;
