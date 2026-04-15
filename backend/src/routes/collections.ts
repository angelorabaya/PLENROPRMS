import { Router, Request, Response } from 'express';
import { query, body } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate, ApiError } from '../middleware/index.js';
import {
    successResponse,
    paginatedResponse,
    parsePagination,
    logActivity
} from '../utils/index.js';
import type { PaymentCollection } from '../types/index.js';

const router = Router();

const fetchAssessmentPayments = async (controlNo: string) => {
    const result = await executeQuery<{
        aop_mod: string;
        b_name: string | null;
        aop_chkdate: string | null;
        aop_chkno: string | null;
        aop_amount: number;
    }>(
        `SELECT
            am.aop_mod,
            b.b_name,
            am.aop_chkdate,
            am.aop_chkno,
            am.aop_amount
        FROM tbl_assessmentmod AS am
        LEFT JOIN tbl_banks AS b ON am.aop_bankid = b.b_ctrlno
        WHERE am.aop_control = @controlNo`,
        { controlNo }
    );

    return result.recordset.map((item) => ({
        mode: (String(item.aop_mod).trim() as 'Cash' | 'Check') || 'Cash',
        amount: item.aop_amount,
        description: item.b_name || '',
        checkDate: item.aop_chkdate ? new Date(item.aop_chkdate).toISOString().split('T')[0] : '',
        checkNo: item.aop_chkno || '',
    }));
};

/**
 * GET /api/collections/banks
 * Get list of banks for autocomplete
 */
router.get(
    '/banks',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ b_name: string; b_ctrlno: string }>(
            `SELECT tbl_banks.b_name, tbl_banks.b_ctrlno
            FROM tbl_banks
            ORDER BY tbl_banks.b_name`
        );

        const banks = result.recordset.map(bank => bank.b_name);
        res.json(successResponse(banks));
    })
);

/**
 * GET /api/collections/lookup/:controlNo
 * Lookup assessment header by control number
 * Returns client name and nature of payment
 */
router.get(
    '/lookup/:controlNo',
    asyncHandler(async (req: Request, res: Response) => {
        const { controlNo } = req.params;

        // Build full control number with AOP prefix
        const fullControlNo = `AOP${controlNo}`;

        const result = await executeQuery<{
            aop_control: string;
            ph_cname: string;
            aop_nature: string;
            aop_orno: string | null;
            aop_ordate: Date | null;
            aop_brgy: string | null;
            aop_brgycombo: string | null;
            aop_mun: string | null;
        }>(
            `SELECT
                ah.aop_control,
                c.ph_cname,
                ah.aop_nature,
                ah.aop_orno,
                ah.aop_ordate,
                ah.aop_brgy,
                ah.aop_brgycombo,
                ah.aop_mun
            FROM tbl_assessmenthdr AS ah
            INNER JOIN tbl_client AS c
                ON ah.aop_clientid = c.ph_ctrlno
            WHERE ah.aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        if (result.recordset.length === 0) {
            throw new ApiError(404, 'Assessment record not found');
        }

        const record = result.recordset[0];
        let orProvincialShare = '';
        let orMunicipalShare = '';
        const barangay =
            record.aop_brgycombo && record.aop_brgycombo.trim() !== ''
                ? record.aop_brgycombo
                : record.aop_brgy;

        if (record.aop_orno) {
            const cleanOr = (or: string) => or.replace(/[Bb]/g, '').trim();

            if (record.aop_orno.includes('/')) {
                const parts = record.aop_orno.split('/');
                if (parts.length > 0) orProvincialShare = cleanOr(parts[0]);
                if (parts.length > 1) orMunicipalShare = cleanOr(parts[1]);
            } else {
                orProvincialShare = cleanOr(record.aop_orno);
            }
        }

        res.json(successResponse({
            controlNo: record.aop_control,
            clientName: record.ph_cname,
            nature: record.aop_nature,
            barangay: barangay,
            municipality: record.aop_mun,
            orProvincialShare,
            orMunicipalShare,
            orDate: record.aop_ordate ? new Date(record.aop_ordate).toISOString().split('T')[0] : null,
        }));
    })
);

/**
 * GET /api/collections/fees/:controlNo
 * Get fee breakdown details by control number
 * Returns list of fee items with descriptions and amounts
 */
router.get(
    '/fees/:controlNo',
    asyncHandler(async (req: Request, res: Response) => {
        const { controlNo } = req.params;

        // Build full control number with AOP prefix
        const fullControlNo = `AOP${controlNo}`;

        const result = await executeQuery<{
            aop_control: string;
            aop_item: string;
            aop_total: number;
            aop_volume: string;
            aop_measure: string;
        }>(
            `SELECT
                ad.aop_control,
                ad.aop_item,
                ad.aop_total,
                ad.aop_volume,
                ad.aop_measure
            FROM dbo.tbl_assessmentdtl AS ad
            WHERE ad.aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        if (result.recordset.length === 0) {
            throw new ApiError(404, 'No fee details found for this control number');
        }

        // Transform the data for frontend
        const fees = result.recordset.map((item, index) => {
            let description = item.aop_item;
            if (item.aop_measure && item.aop_measure !== 'N/A') {
                description += ` (${item.aop_volume} ${item.aop_measure})`;
            }

            return {
                id: String(index + 1),
                description: description,
                amount: item.aop_total,
            };
        });

        res.json(successResponse({
            controlNo: fullControlNo,
            fees,
            total: fees.reduce((sum, fee) => sum + fee.amount, 0),
        }));
    })
);

/**
 * GET /api/collections/payments/:controlNo
 * Get payment details by control number
 */
router.get(
    '/payments/:controlNo',
    asyncHandler(async (req: Request, res: Response) => {
        const { controlNo } = req.params;
        const fullControlNo = `AOP${controlNo}`;

        const result = await executeQuery<{
            aop_mod: string;
            b_name: string | null;
            aop_chkdate: string | null;
            aop_chkno: string | null;
            aop_amount: number;
        }>(
            `SELECT
                am.aop_mod,
                b.b_name,
                am.aop_chkdate,
                am.aop_chkno,
                am.aop_amount
            FROM tbl_assessmentmod AS am
            LEFT JOIN tbl_banks AS b ON am.aop_bankid = b.b_ctrlno
            WHERE am.aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        const payments = result.recordset.map((item, index) => ({
            id: String(index + 1),
            mode: (String(item.aop_mod).trim() as 'Cash' | 'Check') || 'Cash', // Default to Cash if empty, effectively matching DB value
            amount: item.aop_amount,
            description: item.b_name || '',
            checkDate: item.aop_chkdate ? new Date(item.aop_chkdate).toISOString().split('T')[0] : '',
            checkNo: item.aop_chkno || '',
        }));

        res.json(successResponse(payments));
    })
);

/**
 * PUT /api/collections/save/:controlNo
 * Update assessment header with OR number and date
 */
router.put(
    '/save/:controlNo',
    [
        body('orProvShare').notEmpty().withMessage('OR Provincial Share is required'),
        body('date').isISO8601().withMessage('Valid date is required'),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { controlNo } = req.params;
        const { orProvShare, date, payments } = req.body;

        // Build full control number with AOP prefix
        const fullControlNo = `AOP${controlNo}`;

        // Check if the record exists first
        const checkResult = await executeQuery<{ aop_control: string; aop_orno: string | null; aop_ordate: Date | null }>(
            `SELECT aop_control, aop_orno, aop_ordate FROM dbo.tbl_assessmenthdr WHERE aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        if (checkResult.recordset.length === 0) {
            throw new ApiError(404, 'Assessment record not found');
        }

        // Check if already paid
        if (checkResult.recordset[0].aop_orno) {
            throw new ApiError(400, 'This record has already been paid');
        }

        const oldPayments = await fetchAssessmentPayments(fullControlNo);
        const oldValues = {
            header: checkResult.recordset[0],
            payments: oldPayments,
        };

        // Update the assessment header with OR number and date
        await executeQuery(
            `UPDATE dbo.tbl_assessmenthdr 
             SET aop_orno = @orNo, 
                 aop_ordate = @orDate
             WHERE aop_control = @controlNo`,
            {
                orNo: orProvShare,
                orDate: date,
                controlNo: fullControlNo
            }
        );

        // Handle payment details if provided
        if (payments && Array.isArray(payments) && payments.length > 0) {
            // First, delete existing payment details for this control number (to ensure clean state)
            await executeQuery(
                `DELETE FROM dbo.tbl_assessmentmod WHERE aop_control = @controlNo`,
                { controlNo: fullControlNo }
            );

            // Insert new payment details
            for (const payment of payments) {
                let bankId = null;

                // Resolve Bank ID if mode is Check and bank name is provided
                if (payment.mode === 'Check' && payment.description) {
                    const bankResult = await executeQuery<{ b_ctrlno: string }>(
                        `SELECT b_ctrlno FROM tbl_banks WHERE b_name = @bankName`,
                        { bankName: payment.description }
                    );
                    if (bankResult.recordset.length > 0) {
                        bankId = bankResult.recordset[0].b_ctrlno;
                    }
                }

                await executeQuery(
                    `INSERT INTO dbo.tbl_assessmentmod 
                    (aop_control, aop_mod, aop_bankid, aop_chkdate, aop_chkno, aop_amount)
                    VALUES 
                    (@controlNo, @mode, @bankId, @checkDate, @checkNo, @amount)`,
                    {
                        controlNo: fullControlNo,
                        mode: payment.mode,
                        bankId: bankId,
                        checkDate: payment.checkDate || null,
                        checkNo: payment.checkNo || null,
                        amount: payment.amount
                    }
                );
            }
        }

        const updatedHeader = await executeQuery<{ aop_control: string; aop_orno: string | null; aop_ordate: Date | null }>(
            `SELECT aop_control, aop_orno, aop_ordate FROM dbo.tbl_assessmenthdr WHERE aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );
        const newPayments = await fetchAssessmentPayments(fullControlNo);

        await logActivity(req, {
            action: 'UPDATE',
            tableName: 'tbl_assessmenthdr',
            recordId: fullControlNo,
            oldValues,
            newValues: {
                header: updatedHeader.recordset[0] || null,
                payments: newPayments,
            },
        });

        res.json(successResponse(
            { controlNo: fullControlNo, orNo: orProvShare, orDate: date },
            'Payment saved successfully'
        ));
    })
);

/**
 * DELETE /api/collections/cancel/:controlNo
 * Cancel payment - clears OR number and date, deletes payment records
 */
router.delete(
    '/cancel/:controlNo',
    asyncHandler(async (req: Request, res: Response) => {
        const { controlNo } = req.params;

        // Build full control number with AOP prefix
        const fullControlNo = `AOP${controlNo}`;

        // Check if the record exists first
        const checkResult = await executeQuery<{ aop_control: string; aop_orno: string | null; aop_ordate: Date | null }>(
            `SELECT aop_control, aop_orno, aop_ordate FROM dbo.tbl_assessmenthdr WHERE aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        if (checkResult.recordset.length === 0) {
            throw new ApiError(404, 'Assessment record not found');
        }

        // Check if record has a payment to cancel
        if (!checkResult.recordset[0].aop_orno) {
            throw new ApiError(400, 'This record has no payment to cancel');
        }

        const oldPayments = await fetchAssessmentPayments(fullControlNo);
        const oldValues = {
            header: checkResult.recordset[0],
            payments: oldPayments,
        };

        // Clear OR number and OR date in assessment header
        await executeQuery(
            `UPDATE tbl_assessmenthdr 
             SET aop_orno = NULL, 
                 aop_ordate = NULL
             WHERE aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        // Delete payment records from tbl_assessmentmod
        await executeQuery(
            `DELETE FROM tbl_assessmentmod
             WHERE aop_control = @controlNo`,
            { controlNo: fullControlNo }
        );

        await logActivity(req, {
            action: 'DELETE',
            tableName: 'tbl_assessmenthdr',
            recordId: fullControlNo,
            oldValues,
            newValues: {
                header: { aop_control: fullControlNo, aop_orno: null, aop_ordate: null },
                payments: [],
            },
        });

        res.json(successResponse(
            { controlNo: fullControlNo },
            'Payment cancelled successfully'
        ));
    })
);

/**
 * GET /api/collections
 * Get all payment collections with pagination
 */
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
        query('paymentMethod').optional().isIn(['cash', 'check', 'bank_transfer']),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, offset } = parsePagination(
            req.query.page as string,
            req.query.limit as string
        );
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const paymentMethod = req.query.paymentMethod as string;

        // Build WHERE clause
        const conditions: string[] = [];
        const params: Record<string, unknown> = {};

        if (startDate && endDate) {
            conditions.push('paymentDate BETWEEN @startDate AND @endDate');
            params.startDate = startDate;
            params.endDate = endDate;
        }
        if (paymentMethod) {
            conditions.push('paymentMethod = @paymentMethod');
            params.paymentMethod = paymentMethod;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // Get total count
        const countResult = await executeQuery<{ total: number }>(
            `SELECT COUNT(*) as total FROM PaymentCollections ${whereClause}`,
            params
        );
        const total = countResult.recordset[0]?.total || 0;

        // Get paginated data
        const dataResult = await executeQuery<PaymentCollection>(
            `SELECT * FROM PaymentCollections ${whereClause}
       ORDER BY paymentDate DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
            { ...params, offset, limit }
        );

        res.json(paginatedResponse(dataResult.recordset, page, limit, total));
    })
);

/**
 * GET /api/collections/:id
 * Get a single collection by ID
 */
router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        const result = await executeQuery<PaymentCollection>(
            'SELECT * FROM PaymentCollections WHERE id = @id',
            { id: parseInt(id, 10) }
        );

        if (result.recordset.length === 0) {
            throw new ApiError(404, 'Collection not found');
        }

        res.json(successResponse(result.recordset[0]));
    })
);

/**
 * POST /api/collections
 * Create a new payment collection
 */
router.post(
    '/',
    [
        body('orNumber').notEmpty().withMessage('OR Number is required'),
        body('clientName').notEmpty().withMessage('Client name is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
        body('paymentDate').isISO8601().withMessage('Valid payment date is required'),
        body('paymentMethod').isIn(['cash', 'check', 'bank_transfer']),
        body('permitId').optional().isInt(),
        body('permitNumber').optional().isString(),
        body('collectedBy').optional().isString(),
        body('remarks').optional().isString(),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const {
            orNumber,
            permitId,
            permitNumber,
            clientName,
            amount,
            paymentDate,
            paymentMethod,
            collectedBy,
            remarks,
        } = req.body;

        const result = await executeQuery<{ id: number }>(
            `INSERT INTO PaymentCollections 
        (orNumber, permitId, permitNumber, clientName, amount, paymentDate, 
         paymentMethod, collectedBy, remarks, createdAt, updatedAt)
       OUTPUT INSERTED.id
       VALUES 
        (@orNumber, @permitId, @permitNumber, @clientName, @amount, @paymentDate,
         @paymentMethod, @collectedBy, @remarks, GETDATE(), GETDATE())`,
            {
                orNumber,
                permitId: permitId || null,
                permitNumber: permitNumber || null,
                clientName,
                amount,
                paymentDate,
                paymentMethod,
                collectedBy: collectedBy || null,
                remarks: remarks || null,
            }
        );

        const newId = result.recordset[0]?.id;

        res.status(201).json(successResponse(
            { id: newId },
            'Payment collection created successfully'
        ));
    })
);

/**
 * GET /api/collections/summary
 * Get collections summary statistics
 */
router.get(
    '/report/summary',
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
            dateFilter = 'WHERE paymentDate BETWEEN @startDate AND @endDate';
            params.startDate = startDate;
            params.endDate = endDate;
        }

        // Total collections
        const totalResult = await executeQuery(
            `SELECT 
        COUNT(*) as totalRecords,
        SUM(amount) as totalAmount
       FROM PaymentCollections
       ${dateFilter}`,
            params
        );

        // By payment method
        const byMethodResult = await executeQuery(
            `SELECT 
        paymentMethod,
        COUNT(*) as count,
        SUM(amount) as amount
       FROM PaymentCollections
       ${dateFilter}
       GROUP BY paymentMethod`,
            params
        );

        // Daily breakdown (last 7 days)
        const dailyResult = await executeQuery(
            `SELECT 
        CAST(paymentDate as DATE) as date,
        COUNT(*) as count,
        SUM(amount) as amount
       FROM PaymentCollections
       WHERE paymentDate >= DATEADD(day, -7, GETDATE())
       GROUP BY CAST(paymentDate as DATE)
       ORDER BY date DESC`
        );

        res.json(successResponse({
            ...(totalResult.recordset[0] as Record<string, unknown>),
            byPaymentMethod: byMethodResult.recordset,
            dailyBreakdown: dailyResult.recordset,
        }));
    })
);

export default router;
