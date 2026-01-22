/**
 * Permit entity interface
 */
export interface Permit {
    id: number;
    permitNumber: string;
    clientName: string;
    clientAddress?: string;
    barangay?: string;
    permitType: string;
    amount: number;
    barangayShare: number;
    municipalShare: number;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    issueDate?: Date;
    expiryDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Payment Collection entity interface
 */
export interface PaymentCollection {
    id: number;
    orNumber: string;
    permitId?: number;
    permitNumber?: string;
    clientName: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: 'cash' | 'check' | 'bank_transfer';
    collectedBy?: string;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Barangay entity interface
 */
export interface Barangay {
    id: number;
    code: string;
    name: string;
    municipality?: string;
    province?: string;
    isActive: boolean;
}

/**
 * Summary report interfaces
 */
export interface BarangayShareSummary {
    barangayId: number;
    barangayName: string;
    totalPermits: number;
    totalAmount: number;
    totalShare: number;
    period: string;
}

export interface MunicipalShareSummary {
    totalPermits: number;
    totalAmount: number;
    totalShare: number;
    period: string;
    byPermitType: {
        permitType: string;
        count: number;
        amount: number;
        share: number;
    }[];
}

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
    totalPermits: number;
    totalCollections: number;
    barangayShare: number;
    municipalShare: number;
    pendingPermits: number;
    recentCollections: PaymentCollection[];
}
