import { Router, Request, Response } from 'express';
import { query } from 'express-validator';
import { executeQuery } from '../config/index.js';
import { asyncHandler, validate } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

/**
 * Barangay Share Detail record interface
 */
interface BarangayShareDetailRecord {
    RptYear: number;
    Municipality: string;
    Barangay: string;
    ControlNum: string;
    ORDate: Date;
    ORNumber: string;
    ClientName: string;
    TotalAmount: number;
    Percent: string;
    BarangayShare: number;
}

/**
 * GET /api/barangay-share-details
 * Get detailed share breakdown for a specific barangay filtered by year, municipality, and barangay
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

        const result = await executeQuery<BarangayShareDetailRecord>(
            `WITH LatestPermit_CTE AS (
                -- Step 1: Get the Latest Permit
                SELECT 
                    P.ph_lnkctrl, 
                    P.ph_brgy2
                FROM tbl_clientpermit P
                INNER JOIN (
                    SELECT ph_lnkctrl, MAX(ph_ctrlno) as MaxCtrl
                    FROM tbl_clientpermit
                    GROUP BY ph_lnkctrl
                ) MaxP ON P.ph_lnkctrl = MaxP.ph_lnkctrl AND P.ph_ctrlno = MaxP.MaxCtrl
            ),
            DetailedTransactions_CTE AS (
                -- Step 2: Generate the rows (Splitting Primary vs Secondary)
                
                -- Part A: Primary Barangay
                SELECT 
                    YEAR(T.aop_ordate) AS RptYear,
                    T.aop_mun, 
                    T.aop_brgy, 
                    T.aop_control,
                    T.aop_ordate,
                    T.aop_orno,
                    C.ph_cname,
                    T.aop_total,
                    -- Calculate Percent column
                    CASE 
                        WHEN ISNULL(L.ph_brgy2, '') <> '' THEN 0.2 
                        ELSE 0.4 
                    END AS SharePercent,
                    -- Calculate Share Amount
                    (T.aop_total * CASE 
                        WHEN ISNULL(L.ph_brgy2, '') <> '' THEN 0.2 
                        ELSE 0.4 
                    END) AS BarangayShare
                FROM 
                    tbl_assessmenthdr T
                LEFT JOIN 
                    LatestPermit_CTE L ON T.aop_clientid = L.ph_lnkctrl
                LEFT JOIN 
                    tbl_client C ON T.aop_clientid = C.ph_ctrlno
                WHERE 
                    T.aop_orno IS NOT NULL 
                    AND T.aop_nature LIKE '%Government Share%'

                UNION ALL

                -- Part B: Secondary Barangay
                SELECT 
                    YEAR(T.aop_ordate) AS RptYear,
                    T.aop_mun, 
                    L.ph_brgy2 AS aop_brgy, -- Uses the 2nd Barangay Name
                    T.aop_control,
                    T.aop_ordate,
                    T.aop_orno,
                    C.ph_cname,
                    T.aop_total,
                    0.2 AS SharePercent,    -- Fixed at 20%
                    (T.aop_total * 0.2) AS BarangayShare
                FROM 
                    tbl_assessmenthdr T
                INNER JOIN 
                    LatestPermit_CTE L ON T.aop_clientid = L.ph_lnkctrl
                LEFT JOIN 
                    tbl_client C ON T.aop_clientid = C.ph_ctrlno
                WHERE 
                    T.aop_orno IS NOT NULL 
                    AND T.aop_nature LIKE '%Government Share%'
                    AND ISNULL(L.ph_brgy2, '') <> '' 
            )

            -- Step 3: Final Selection with FILTERS
            SELECT 
                RptYear,
                aop_mun AS Municipality,
                aop_brgy AS Barangay,
                aop_control AS ControlNum,
                aop_ordate AS ORDate,
                aop_orno AS ORNumber,
                ph_cname AS ClientName,
                aop_total AS TotalAmount,
                FORMAT(SharePercent, 'P0') AS [Percent], 
                BarangayShare
            FROM 
                DetailedTransactions_CTE
            WHERE 
                RptYear = @year 
                AND aop_mun = @municipality 
                AND aop_brgy = @barangay
            ORDER BY 
                aop_ordate ASC`,
            { year, municipality, barangay }
        );

        res.json(successResponse(result.recordset));
    })
);

/**
 * GET /api/barangay-share-details/summary
 * Get share summary totals
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

        const result = await executeQuery<{ totalRecords: number; totalShare: number }>(
            `WITH LatestPermit_CTE AS (
                SELECT 
                    P.ph_lnkctrl, 
                    P.ph_brgy2
                FROM tbl_clientpermit P
                INNER JOIN (
                    SELECT ph_lnkctrl, MAX(ph_ctrlno) as MaxCtrl
                    FROM tbl_clientpermit
                    GROUP BY ph_lnkctrl
                ) MaxP ON P.ph_lnkctrl = MaxP.ph_lnkctrl AND P.ph_ctrlno = MaxP.MaxCtrl
            ),
            DetailedTransactions_CTE AS (
                SELECT 
                    YEAR(T.aop_ordate) AS RptYear,
                    T.aop_mun, 
                    T.aop_brgy, 
                    (T.aop_total * CASE 
                        WHEN ISNULL(L.ph_brgy2, '') <> '' THEN 0.2 
                        ELSE 0.4 
                    END) AS BarangayShare
                FROM 
                    tbl_assessmenthdr T
                LEFT JOIN 
                    LatestPermit_CTE L ON T.aop_clientid = L.ph_lnkctrl
                WHERE 
                    T.aop_orno IS NOT NULL 
                    AND T.aop_nature LIKE '%Government Share%'

                UNION ALL

                SELECT 
                    YEAR(T.aop_ordate) AS RptYear,
                    T.aop_mun, 
                    L.ph_brgy2 AS aop_brgy,
                    (T.aop_total * 0.2) AS BarangayShare
                FROM 
                    tbl_assessmenthdr T
                INNER JOIN 
                    LatestPermit_CTE L ON T.aop_clientid = L.ph_lnkctrl
                WHERE 
                    T.aop_orno IS NOT NULL 
                    AND T.aop_nature LIKE '%Government Share%'
                    AND ISNULL(L.ph_brgy2, '') <> '' 
            )
            SELECT 
                COUNT(*) as totalRecords,
                ISNULL(SUM(BarangayShare), 0) as totalShare
            FROM 
                DetailedTransactions_CTE
            WHERE 
                RptYear = @year 
                AND aop_mun = @municipality 
                AND aop_brgy = @barangay`,
            { year, municipality, barangay }
        );

        const summaryData = result.recordset[0];

        res.json(successResponse({
            year,
            municipality,
            barangay,
            totalRecords: summaryData?.totalRecords || 0,
            totalShare: summaryData?.totalShare || 0,
        }));
    })
);

export default router;
