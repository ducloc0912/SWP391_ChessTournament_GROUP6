-- Waiting_List: thêm cột cho giữ chỗ 4h và khóa 24h khi hết hạn không thanh toán
USE SWP391;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Waiting_List') AND name = 'payment_expires_at')
BEGIN
    ALTER TABLE Waiting_List ADD payment_expires_at DATETIME NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Waiting_List') AND name = 'removed_at')
BEGIN
    ALTER TABLE Waiting_List ADD removed_at DATETIME NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Waiting_List') AND name = 'removed_reason')
BEGIN
    ALTER TABLE Waiting_List ADD removed_reason NVARCHAR(50) NULL;
END
GO

-- Mở rộng status: PendingPayment (chờ thanh toán), Expired (hết hạn)
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Waiting_List_status' AND parent_object_id = OBJECT_ID('Waiting_List'))
    ALTER TABLE Waiting_List DROP CONSTRAINT CK_Waiting_List_status;
GO
ALTER TABLE Waiting_List ADD CONSTRAINT CK_Waiting_List_status
    CHECK (status IN ('Pending','PendingPayment','Approved','Rejected','Expired'));
GO
