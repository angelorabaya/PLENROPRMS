import type { Request } from 'express';
import { executeQuery } from '../config/index.js';

export interface AuditLogDetails {
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    tableName: string;
    recordId?: string | number | null;
    oldValues?: unknown;
    newValues?: unknown;
}

const getHeaderValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
};

const getIpAddress = (req: Request): string => {
    const forwarded = getHeaderValue(req.headers['x-forwarded-for']);
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || '';
    }
    return req.socket?.remoteAddress || '';
};

export const logActivity = async (req: Request, details: AuditLogDetails): Promise<void> => {
    try {
        const userId = getHeaderValue(req.headers['x-log-user']);
        const userName = getHeaderValue(req.headers['x-log-cname']);
        const ipAddress = getIpAddress(req);
        const userAgent = getHeaderValue(req.headers['user-agent']);

        await executeQuery(
            `INSERT INTO ActivityLogs (
                UserID,
                UserName,
                ActionType,
                TableName,
                RecordID,
                OldValues,
                NewValues,
                IPAddress,
                UserAgent
            ) VALUES (
                @userId,
                @userName,
                @action,
                @tableName,
                @recordId,
                @oldValues,
                @newValues,
                @ipAddress,
                @userAgent
            )`,
            {
                userId: userId || null,
                userName: userName || null,
                action: details.action,
                tableName: details.tableName,
                recordId: details.recordId ?? null,
                oldValues: details.oldValues ? JSON.stringify(details.oldValues) : null,
                newValues: details.newValues ? JSON.stringify(details.newValues) : null,
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
            }
        );
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};
