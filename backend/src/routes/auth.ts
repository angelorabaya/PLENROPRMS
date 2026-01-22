import { Router, Request, Response } from 'express';
import { executeQuery } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

interface LoginUser {
    log_user: string;
    log_pass: string;
    log_cname: string;
}

/**
 * POST /api/auth/login
 * Authenticate user with username and password
 */
router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // Query user from tbl_login
        const result = await executeQuery<LoginUser>(
            `SELECT log_user, log_pass, log_cname 
             FROM tbl_login 
             WHERE log_user = @username AND log_pass = @password`,
            { username, password }
        );

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const user = result.recordset[0];

        res.json(successResponse({
            username: user.log_user,
            name: user.log_cname,
        }));
    })
);

export default router;
