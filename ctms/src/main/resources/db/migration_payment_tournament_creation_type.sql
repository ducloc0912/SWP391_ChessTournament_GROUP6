-- Migration: cho phép type 'TournamentCreation' trong Payment_Transaction
-- Cần chạy script này để hệ thống có thể ghi transaction khi leader tạo giải đấu

-- Bước 1: Tìm và xóa constraint cũ
DECLARE @constraintName NVARCHAR(200);
SELECT @constraintName = dc.name
FROM sys.check_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'Payment_Transaction' AND c.name = 'type';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE Payment_Transaction DROP CONSTRAINT ' + @constraintName);
END
GO

-- Bước 2: Thêm constraint mới có thêm 'TournamentCreation'
ALTER TABLE Payment_Transaction
ADD CONSTRAINT CK_Payment_Transaction_Type 
CHECK (type IN ('EntryFee','Prize','Refund','Deposit','Withdrawal','TournamentCreation'));
GO

PRINT 'Migration completed: Added TournamentCreation type to Payment_Transaction';
