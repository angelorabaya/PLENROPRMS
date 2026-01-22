-- ============================================================================
-- PLENRO-PTO Database Schema
-- Database: ENRODB
-- SQL Server (MSSQL)
-- ============================================================================

-- Create database if not exists (run this separately with master context)
-- IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ENRODB')
-- BEGIN
--     CREATE DATABASE ENRODB;
-- END
-- GO

USE ENRODB;
GO

-- ============================================================================
-- Barangays Table
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Barangays')
BEGIN
    CREATE TABLE Barangays (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(20) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        municipality NVARCHAR(100) DEFAULT 'Municipality',
        province NVARCHAR(100) DEFAULT 'Province',
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );

    -- Create index on name
    CREATE INDEX IX_Barangays_Name ON Barangays(name);
    
    PRINT 'Created table: Barangays';
END
GO

-- ============================================================================
-- Permit Types Table
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PermitTypes')
BEGIN
    CREATE TABLE PermitTypes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(20) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        baseFee DECIMAL(18,2) DEFAULT 0,
        barangaySharePercent DECIMAL(5,2) DEFAULT 20.00,
        municipalSharePercent DECIMAL(5,2) DEFAULT 80.00,
        isActive BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created table: PermitTypes';
END
GO

-- ============================================================================
-- Permits Table
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permits')
BEGIN
    CREATE TABLE Permits (
        id INT IDENTITY(1,1) PRIMARY KEY,
        permitNumber NVARCHAR(50) NOT NULL UNIQUE,
        clientName NVARCHAR(200) NOT NULL,
        clientAddress NVARCHAR(500),
        barangay NVARCHAR(100),
        barangayId INT,
        permitType NVARCHAR(100) NOT NULL,
        permitTypeId INT,
        amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        barangayShare DECIMAL(18,2) NOT NULL DEFAULT 0,
        municipalShare DECIMAL(18,2) NOT NULL DEFAULT 0,
        status NVARCHAR(20) DEFAULT 'pending' 
            CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
        issueDate DATE,
        expiryDate DATE,
        remarks NVARCHAR(1000),
        processedBy NVARCHAR(100),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Keys
        CONSTRAINT FK_Permits_Barangay FOREIGN KEY (barangayId) 
            REFERENCES Barangays(id),
        CONSTRAINT FK_Permits_PermitType FOREIGN KEY (permitTypeId) 
            REFERENCES PermitTypes(id)
    );

    -- Create indexes
    CREATE INDEX IX_Permits_Status ON Permits(status);
    CREATE INDEX IX_Permits_Barangay ON Permits(barangay);
    CREATE INDEX IX_Permits_IssueDate ON Permits(issueDate);
    CREATE INDEX IX_Permits_ClientName ON Permits(clientName);
    
    PRINT 'Created table: Permits';
END
GO

-- ============================================================================
-- Payment Collections Table
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PaymentCollections')
BEGIN
    CREATE TABLE PaymentCollections (
        id INT IDENTITY(1,1) PRIMARY KEY,
        orNumber NVARCHAR(50) NOT NULL UNIQUE,
        permitId INT,
        permitNumber NVARCHAR(50),
        clientName NVARCHAR(200) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        paymentDate DATETIME2 NOT NULL,
        paymentMethod NVARCHAR(20) DEFAULT 'cash'
            CHECK (paymentMethod IN ('cash', 'check', 'bank_transfer')),
        checkNumber NVARCHAR(50),
        bankName NVARCHAR(100),
        collectedBy NVARCHAR(100),
        remarks NVARCHAR(500),
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE(),
        
        -- Foreign Key
        CONSTRAINT FK_Collections_Permit FOREIGN KEY (permitId) 
            REFERENCES Permits(id)
    );

    -- Create indexes
    CREATE INDEX IX_Collections_PaymentDate ON PaymentCollections(paymentDate);
    CREATE INDEX IX_Collections_ORNumber ON PaymentCollections(orNumber);
    CREATE INDEX IX_Collections_PermitId ON PaymentCollections(permitId);
    
    PRINT 'Created table: PaymentCollections';
END
GO

-- ============================================================================
-- Users Table (for authentication - optional)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NOT NULL,
        email NVARCHAR(100),
        fullName NVARCHAR(100),
        role NVARCHAR(20) DEFAULT 'user'
            CHECK (role IN ('admin', 'user', 'viewer')),
        isActive BIT DEFAULT 1,
        lastLogin DATETIME2,
        createdAt DATETIME2 DEFAULT GETDATE(),
        updatedAt DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created table: Users';
END
GO

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample barangays
IF NOT EXISTS (SELECT * FROM Barangays)
BEGIN
    INSERT INTO Barangays (code, name, municipality, province) VALUES
    ('BRG001', 'Poblacion', 'San Jose', 'Province'),
    ('BRG002', 'San Antonio', 'San Jose', 'Province'),
    ('BRG003', 'San Miguel', 'San Jose', 'Province'),
    ('BRG004', 'Santa Cruz', 'San Jose', 'Province'),
    ('BRG005', 'Santo Niño', 'San Jose', 'Province');
    
    PRINT 'Inserted sample barangays';
END
GO

-- Insert sample permit types
IF NOT EXISTS (SELECT * FROM PermitTypes)
BEGIN
    INSERT INTO PermitTypes (code, name, description, baseFee, barangaySharePercent, municipalSharePercent) VALUES
    ('BP', 'Business Permit', 'Annual business permit', 500.00, 20.00, 80.00),
    ('BLD', 'Building Permit', 'Construction/renovation permit', 1000.00, 20.00, 80.00),
    ('OCC', 'Occupancy Permit', 'Certificate of occupancy', 300.00, 20.00, 80.00),
    ('SAN', 'Sanitary Permit', 'Health and sanitation permit', 200.00, 20.00, 80.00),
    ('FIRE', 'Fire Safety Permit', 'Fire safety inspection certificate', 500.00, 20.00, 80.00);
    
    PRINT 'Inserted sample permit types';
END
GO

-- Insert sample permits
IF NOT EXISTS (SELECT * FROM Permits)
BEGIN
    INSERT INTO Permits (permitNumber, clientName, clientAddress, barangay, permitType, amount, barangayShare, municipalShare, status, issueDate, expiryDate) VALUES
    ('PRM-2024-0001', 'Juan Dela Cruz Store', '123 Main St', 'Poblacion', 'Business Permit', 5000.00, 1000.00, 4000.00, 'approved', '2024-01-15', '2024-12-31'),
    ('PRM-2024-0002', 'Maria Santos Enterprises', '456 Commerce Ave', 'San Antonio', 'Business Permit', 7500.00, 1500.00, 6000.00, 'approved', '2024-02-01', '2024-12-31'),
    ('PRM-2024-0003', 'Pedro Construction', '789 Builder Rd', 'San Miguel', 'Building Permit', 15000.00, 3000.00, 12000.00, 'pending', NULL, NULL),
    ('PRM-2024-0004', 'ABC Restaurant', '321 Food St', 'Santa Cruz', 'Sanitary Permit', 2000.00, 400.00, 1600.00, 'approved', '2024-03-10', '2024-12-31'),
    ('PRM-2024-0005', 'XYZ Hardware', '654 Tools Ave', 'Santo Niño', 'Fire Safety Permit', 3500.00, 700.00, 2800.00, 'pending', NULL, NULL);
    
    PRINT 'Inserted sample permits';
END
GO

-- Insert sample collections
IF NOT EXISTS (SELECT * FROM PaymentCollections)
BEGIN
    INSERT INTO PaymentCollections (orNumber, permitNumber, clientName, amount, paymentDate, paymentMethod, collectedBy) VALUES
    ('OR-2024-0001', 'PRM-2024-0001', 'Juan Dela Cruz Store', 5000.00, '2024-01-15', 'cash', 'Collector 1'),
    ('OR-2024-0002', 'PRM-2024-0002', 'Maria Santos Enterprises', 7500.00, '2024-02-01', 'check', 'Collector 1'),
    ('OR-2024-0003', 'PRM-2024-0004', 'ABC Restaurant', 2000.00, '2024-03-10', 'cash', 'Collector 2');
    
    PRINT 'Inserted sample collections';
END
GO

PRINT '';
PRINT '✅ Database schema setup complete!';
PRINT '';
GO
