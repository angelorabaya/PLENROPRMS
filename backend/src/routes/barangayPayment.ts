import { Router, Request, Response } from 'express';
import { query, body, param } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate, ApiError } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * Barangay Payment record interface
 */
interface BarangayPaymentRecord {
    bs_ctrlno: string;
    bs_chkdate: Date | null;
    bs_chkno: string | null;
    bs_brgy: string;
    bs_mun: string;
    bs_natureofpayment: string | null;
    bs_year: number;
    bsamount: number;
    bs_claimedby: string | null;
    bs_claimeddate: Date | null;
    bs_datereturned: Date | null;
}

/**
 * GET /api/barangay-payment
 * Get payment details for a specific barangay filtered by year, municipality, and barangay
 */
router.get(
    '/',
    [
        query('year').notEmpty().isInt({ min: 2000, max: 2100 }).withMessage('Year is required'),
        query('municipality').notEmpty().withMessage('Municipality is required'),
        query('barangay').notEmpty().withMessage('Barangay is required'),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(req.query.year as string, 10);
        const municipality = req.query.municipality as string;
        const barangay = req.query.barangay as string;

        const result = await executeQuery<BarangayPaymentRecord>(
            `SELECT 
                [bs_ctrlno],
                [bs_chkdate],
                [bs_chkno],
                [bs_brgy],
                [bs_mun],
                [bs_natureofpayment],
                [bs_year],
                [bsamount],
                [bs_claimedby],
                [bs_claimeddate],
                [bs_datereturned]
            FROM [tbl_brgypayment]
            WHERE bs_year = @year 
                AND bs_mun = @municipality 
                AND bs_brgy = @barangay
            ORDER BY bs_chkdate DESC`,
            { year, municipality, barangay }
        );

        res.json(successResponse(result.recordset));
    })
);

/**
 * POST /api/barangay-payment
 * Create a new payment record
 */
router.post(
    '/',
    [
        body('bs_year').notEmpty().isInt({ min: 2000, max: 2100 }).withMessage('Year is required'),
        body('bs_mun').notEmpty().withMessage('Municipality is required'),
        body('bs_brgy').notEmpty().withMessage('Barangay is required'),
        body('bsamount').notEmpty().isFloat({ min: 0 }).withMessage('Amount is required'),
        body('bs_natureofpayment').optional(),
        body('bs_chkdate').optional(),
        body('bs_chkno').optional(),
        body('bs_claimedby').optional(),
        body('bs_claimeddate').optional(),
        body('bs_datereturned').optional(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const {
            bs_year,
            bs_mun,
            bs_brgy,
            bsamount,
            bs_natureofpayment,
            bs_chkdate,
            bs_chkno,
            bs_claimedby,
            bs_claimeddate,
            bs_datereturned,
        } = req.body;

        const result = await executeQuery(
            `INSERT INTO [tbl_brgypayment] (
                [bs_year],
                [bs_mun],
                [bs_brgy],
                [bsamount],
                [bs_natureofpayment],
                [bs_chkdate],
                [bs_chkno],
                [bs_claimedby],
                [bs_claimeddate],
                [bs_datereturned]
            ) VALUES (
                @bs_year,
                @bs_mun,
                @bs_brgy,
                @bsamount,
                @bs_natureofpayment,
                @bs_chkdate,
                @bs_chkno,
                @bs_claimedby,
                @bs_claimeddate,
                @bs_datereturned
            )`,
            {
                bs_year,
                bs_mun,
                bs_brgy,
                bsamount,
                bs_natureofpayment: bs_natureofpayment || null,
                bs_chkdate: bs_chkdate || null,
                bs_chkno: bs_chkno || null,
                bs_claimedby: bs_claimedby || null,
                bs_claimeddate: bs_claimeddate || null,
                bs_datereturned: bs_datereturned || null,
            }
        );

        if (result.rowsAffected[0] === 0) {
            throw new ApiError(500, 'Failed to create payment record');
        }

        res.status(201).json(successResponse(null, 'Payment record created successfully'));
    })
);

/**
 * PUT /api/barangay-payment/:ctrlno
 * Update an existing payment record
 */
router.put(
    '/:ctrlno',
    [
        param('ctrlno').notEmpty().withMessage('Control number is required'),
        body('bsamount').optional().isFloat({ min: 0 }),
        body('bs_natureofpayment').optional(),
        body('bs_chkdate').optional(),
        body('bs_chkno').optional(),
        body('bs_claimedby').optional(),
        body('bs_claimeddate').optional(),
        body('bs_datereturned').optional(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { ctrlno } = req.params;
        const {
            bsamount,
            bs_natureofpayment,
            bs_chkdate,
            bs_chkno,
            bs_claimedby,
            bs_claimeddate,
            bs_datereturned,
        } = req.body;

        const result = await executeQuery(
            `UPDATE [tbl_brgypayment] SET
                [bsamount] = COALESCE(@bsamount, [bsamount]),
                [bs_natureofpayment] = @bs_natureofpayment,
                [bs_chkdate] = @bs_chkdate,
                [bs_chkno] = @bs_chkno,
                [bs_claimedby] = @bs_claimedby,
                [bs_claimeddate] = @bs_claimeddate,
                [bs_datereturned] = @bs_datereturned
            WHERE [bs_ctrlno] = @ctrlno`,
            {
                ctrlno,
                bsamount: bsamount !== undefined ? bsamount : null,
                bs_natureofpayment: bs_natureofpayment !== undefined ? bs_natureofpayment : null,
                bs_chkdate: bs_chkdate !== undefined ? bs_chkdate : null,
                bs_chkno: bs_chkno !== undefined ? bs_chkno : null,
                bs_claimedby: bs_claimedby !== undefined ? bs_claimedby : null,
                bs_claimeddate: bs_claimeddate !== undefined ? bs_claimeddate : null,
                bs_datereturned: bs_datereturned !== undefined ? bs_datereturned : null,
            }
        );

        if (result.rowsAffected[0] === 0) {
            throw new ApiError(404, 'Payment record not found');
        }

        res.json(successResponse(null, 'Payment record updated successfully'));
    })
);

/**
 * DELETE /api/barangay-payment/:ctrlno
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
            `DELETE FROM [tbl_brgypayment] WHERE [bs_ctrlno] = @ctrlno`,
            { ctrlno }
        );

        if (result.rowsAffected[0] === 0) {
            throw new ApiError(404, 'Payment record not found');
        }

        res.json(successResponse(null, 'Payment record deleted successfully'));
    })
);

/**
 * GET /api/barangay-payment/summary
 * Get payment summary totals
 */
router.get(
    '/summary',
    [
        query('year').notEmpty().isInt({ min: 2000, max: 2100 }),
        query('municipality').notEmpty(),
        query('barangay').notEmpty(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const year = parseInt(req.query.year as string, 10);
        const municipality = req.query.municipality as string;
        const barangay = req.query.barangay as string;

        const result = await executeQuery<{ totalPayments: number; totalAmount: number }>(
            `SELECT 
                COUNT(*) as totalPayments,
                ISNULL(SUM(bsamount), 0) as totalAmount
            FROM [tbl_brgypayment]
            WHERE bs_year = @year 
                AND bs_mun = @municipality 
                AND bs_brgy = @barangay`,
            { year, municipality, barangay }
        );

        const summaryData = result.recordset[0];

        res.json(successResponse({
            year,
            municipality,
            barangay,
            totalPayments: summaryData?.totalPayments || 0,
            totalAmount: summaryData?.totalAmount || 0,
        }));
    })
);

export default router;

