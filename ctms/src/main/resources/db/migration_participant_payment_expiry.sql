-- Participants: hạn thanh toán 1h cho đăng ký chưa thanh toán, removed_at cho 24h block
USE SWP391;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Participants') AND name = 'payment_expires_at')
BEGIN
    ALTER TABLE Participants ADD payment_expires_at DATETIME NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Participants') AND name = 'removed_at')
BEGIN
    ALTER TABLE Participants ADD removed_at DATETIME NULL;
END
GO
