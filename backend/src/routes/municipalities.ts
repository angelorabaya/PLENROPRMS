import { Router, Request, Response } from 'express';
import { param } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * GET /api/municipalities
 * Get all distinct municipality names
 */
router.get(
    '/',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ mun_name: string }>(
            `SELECT DISTINCT mun_name
             FROM tbl_municipalities
             ORDER BY mun_name ASC`
        );

        const municipalities = result.recordset.map(r => r.mun_name);
        res.json(successResponse(municipalities));
    })
);

/**
 * GET /api/municipalities/:municipality/barangays
 * Get barangays for a specific municipality
 */
router.get(
    '/:municipality/barangays',
    [
        param('municipality').notEmpty().withMessage('Municipality is required'),
        validate,
    ],
    asyncHandler(async (req: Request, res: Response) => {
        const { municipality } = req.params;

        const result = await executeQuery<{ mun_brgy: string }>(
            `SELECT mun_brgy
             FROM tbl_municipalities
             WHERE mun_name = @municipality
             ORDER BY mun_brgy ASC`,
            { municipality }
        );

        const barangays = result.recordset.map(r => r.mun_brgy);
        res.json(successResponse(barangays));
    })
);

export default router;
