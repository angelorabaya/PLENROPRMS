import { Router, Request, Response } from 'express';
import { executeQuery } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * GET /api/system/date
 * Get current local date from MS SQL Database in YYYY-MM-DD format
 */
router.get(
    '/date',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ dateString: string }>(
            `SELECT CONVERT(varchar(10), DATEADD(hour, 8, GETUTCDATE()), 120) as dateString`
        );
        
        const dateString = result.recordset[0]?.dateString;
        res.json(successResponse({
            date: dateString
        }));
    })
);

/**
 * GET /api/system/year
 * Get current year from MS SQL Database
 */
router.get(
    '/year',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ currentYear: number }>(
            `SELECT YEAR(DATEADD(hour, 8, GETUTCDATE())) as currentYear`
        );
        
        res.json(successResponse({
            year: result.recordset[0]?.currentYear,
        }));
    })
);

/**
 * GET /api/system/datetime
 * Get current local datetime from MS SQL Database in ISO format
 */
router.get(
    '/datetime',
    asyncHandler(async (_req: Request, res: Response) => {
        const result = await executeQuery<{ datetimeString: string }>(
            `SELECT CONVERT(varchar(23), DATEADD(hour, 8, GETUTCDATE()), 126) + '+08:00' as datetimeString`
        );
        
        const datetimeString = result.recordset[0]?.datetimeString;
        res.json(successResponse({
            datetime: datetimeString
        }));
    })
);

export default router;
