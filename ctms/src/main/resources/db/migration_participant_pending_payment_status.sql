-- Cho phép status PendingPayment (đăng ký chưa thanh toán – chỉ coi là thành viên sau khi thanh toán thành công)
USE SWP391;
GO

-- Chỉ xóa CHECK constraint trên status (có Active/Withdrawn nhưng chưa có PendingPayment)
DECLARE @ConstraintName NVARCHAR(256);
DECLARE @Sql NVARCHAR(500);

SELECT @ConstraintName = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('Participants')
  AND definition LIKE '%Active%' AND definition LIKE '%Withdrawn%'
  AND definition NOT LIKE '%PendingPayment%';

IF @ConstraintName IS NOT NULL
BEGIN
    SET @Sql = 'ALTER TABLE Participants DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
    EXEC sp_executesql @Sql;
END
GO

-- Thêm lại CHECK cho phép PendingPayment (bỏ qua nếu đã có)
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('Participants') AND definition LIKE '%PendingPayment%'
)
BEGIN
    ALTER TABLE Participants ADD CONSTRAINT CK_Participants_Status
        CHECK (status IN ('Active', 'PendingPayment', 'Withdrawn', 'Disqualified'));
END
GO
