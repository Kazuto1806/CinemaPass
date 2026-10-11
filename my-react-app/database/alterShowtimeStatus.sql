USE CinemaDB;
GO

-- 1) Chuẩn hóa dữ liệu cũ có format sai
UPDATE dbo.Showtimes
SET Status = N'Đang hoạt động'
WHERE Status IS NULL
   OR LTRIM(RTRIM(Status)) = ''
   OR Status IN (
        N'Active',
        N'Ðang ho?t d?ng',
        N'Dang ho?t d?ng',
        N'Đang ho?t d?ng',
        N'Đang hoat dong',
        N'Đang hoạt động'
   )
   OR LOWER(REPLACE(Status, N'Ð', N'Đ')) LIKE N'%dang%hoat%dong%'
   OR LOWER(REPLACE(Status, N'Ð', N'Đ')) LIKE N'%dang%hoat%dong%'
   OR LOWER(REPLACE(Status, N'Ð', N'Đ')) LIKE N'%active%';
GO

UPDATE dbo.Showtimes
SET Status = N'Tạm ngưng'
WHERE Status IN (
        N'Tam ngung',
        N'Tạm ngưng',
        N'Inactive'
    )
   OR LOWER(REPLACE(Status, N'Ð', N'Đ')) LIKE N'%tam%ngung%';
GO

UPDATE dbo.Showtimes
SET Status = N'Đã kết thúc'
WHERE Status IN (
        N'Đã kt thúc',
        N'Đã ket thuc',
        N'Ket thuc',
        N'Kết thúc',
        N'Đã kết thúc'
    )
   OR LOWER(REPLACE(Status, N'Ð', N'Đ')) LIKE N'%ket%thuc%'
   OR LOWER(REPLACE(Status, N'Ð', N'Đ')) LIKE N'%kt%thuc%';
GO

-- 2) Đảm bảo cột Status đúng kiểu và default
DECLARE @defaultConstraintName sysname;

SELECT @defaultConstraintName = dc.name
FROM sys.default_constraints AS dc
INNER JOIN sys.columns AS c
    ON c.object_id = dc.parent_object_id
   AND c.column_id = dc.parent_column_id
WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Showtimes')
  AND c.name = N'Status';

IF @defaultConstraintName IS NOT NULL
BEGIN
    DECLARE @dropDefaultSql nvarchar(max) =
        N'ALTER TABLE dbo.Showtimes DROP CONSTRAINT ' + QUOTENAME(@defaultConstraintName);
    EXEC sys.sp_executesql @dropDefaultSql;
END;
GO

ALTER TABLE dbo.Showtimes
    ALTER COLUMN Status NVARCHAR(30) NOT NULL;
GO

ALTER TABLE dbo.Showtimes
    ADD CONSTRAINT DF_Showtimes_Status
    DEFAULT (N'Đang hoạt động') FOR Status;
GO

-- 3) Optional: reset identity nếu bạn muốn bắt đầu lại từ 1
-- Chỉ chạy khi bạn đã xóa toàn bộ dữ liệu cũ hoặc biết chắc không còn khóa ngoại tham chiếu.
-- DBCC CHECKIDENT ('dbo.Showtimes', RESEED, 0);
GO