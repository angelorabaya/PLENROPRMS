/**
 * Standard API response interface
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

/**
 * Create a success response
 */
export const successResponse = <T>(
    data: T,
    message = 'Success',
    meta?: ApiResponse['meta']
): ApiResponse<T> => ({
    success: true,
    message,
    data,
    ...(meta && { meta }),
});

/**
 * Create a paginated response
 */
export const paginatedResponse = <T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Success'
): ApiResponse<T[]> => ({
    success: true,
    message,
    data,
    meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    },
});

/**
 * Parse pagination parameters from query
 */
export const parsePagination = (
    page?: string,
    limit?: string
): { page: number; limit: number; offset: number } => {
    const parsedPage = Math.max(1, parseInt(page || '1', 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    return {
        page: parsedPage,
        limit: parsedLimit,
        offset,
    };
};

/**
 * Format date for SQL Server
 */
export const formatDateForSql = (date: Date): string => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Format currency for display (Philippine Peso)
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
};
