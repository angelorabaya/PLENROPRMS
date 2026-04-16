import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';
import { successResponse } from '../utils/index.js';

const router = Router();

interface LoginUser {
    log_user: string;
    log_pass: string;
    log_passhash: string | null;
    log_cname: string;
    log_role: 'Admin' | 'Editor' | 'Viewer' | string | null;
}

/**
 * POST /api/auth/login
 * Authenticate user with username and password.
 * Uses log_passhash when available. Falls back to legacy log_pass only to trigger password migration.
 */
router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // Query user from tbl_login by username first. Password verification depends on whether log_passhash exists.
        const result = await executeQuery<LoginUser>(
            `SELECT log_user, log_pass, log_passhash, log_cname, log_role
             FROM tbl_login 
             WHERE log_user = @username`,
            { username }
        );

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const user = result.recordset[0];
        const normalizedRole =
            user.log_role === 'Admin' || user.log_role === 'Editor' || user.log_role === 'Viewer'
                ? user.log_role
                : 'Viewer';

        if (user.log_passhash) {
            const isValidPassword = await bcrypt.compare(password, user.log_passhash);

            if (!isValidPassword) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            return res.json(
                successResponse({
                    username: user.log_user,
                    name: user.log_cname,
                    role: normalizedRole,
                    requiresPasswordChange: false,
                })
            );
        }

        if (user.log_pass !== password) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        res.json(
            successResponse({
                username: user.log_user,
                name: user.log_cname,
                role: normalizedRole,
                requiresPasswordChange: true,
            })
        );
    })
);

/**
 * POST /api/auth/change-password
 * Migrates a legacy plaintext password to bcrypt and uses it for future authentication.
 */
router.post(
    '/change-password',
    asyncHandler(async (req: Request, res: Response) => {
        const { username, currentPassword, newPassword } = req.body;

        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username, current password, and new password are required',
            });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long',
            });
        }

        const result = await executeQuery<LoginUser>(
            `SELECT log_user, log_pass, log_passhash, log_cname, log_role
             FROM tbl_login
             WHERE log_user = @username`,
            { username }
        );

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.recordset[0];
        const normalizedRole =
            user.log_role === 'Admin' || user.log_role === 'Editor' || user.log_role === 'Viewer'
                ? user.log_role
                : 'Viewer';

        if (user.log_passhash) {
            return res.status(400).json({
                success: false,
                message: 'Password has already been migrated. Please log in with your new password.',
            });
        }

        if (user.log_pass !== currentPassword) {
            return res.status(401).json({ success: false, message: 'Current password is invalid' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await executeQuery(
            `UPDATE tbl_login
             SET log_passhash = @passwordHash
             WHERE log_user = @username`,
            { username, passwordHash }
        );

        res.json(
            successResponse({
                username: user.log_user,
                name: user.log_cname,
                role: normalizedRole,
            }, 'Password updated successfully')
        );
    })
);

export default router;
