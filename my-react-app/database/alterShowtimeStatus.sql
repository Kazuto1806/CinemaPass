USE CinemaDB;
GO

DECLARE @defaultConstraintName sysname;

SELECT @defaultConstraintName = defaultConstraint.name
FROM sys.default_constraints AS defaultConstraint
INNER JOIN sys.columns AS columnInfo
    ON columnInfo.object_id = defaultConstraint.parent_object_id
    AND columnInfo.column_id = defaultConstraint.parent_column_id
WHERE defaultConstraint.parent_object_id = OBJECT_ID(N'dbo.Showtimes')
    AND columnInfo.name = N'Status';

IF @defaultConstraintName IS NOT NULL
BEGIN
    DECLARE @dropDefaultSql nvarchar(max) =
        N'ALTER TABLE dbo.Showtimes DROP CONSTRAINT '
        + QUOTENAME(@defaultConstraintName);

    EXEC sys.sp_executesql @dropDefaultSql;
END;
GO

ALTER TABLE dbo.Showtimes
    ALTER COLUMN Status NVARCHAR(30) NOT NULL;
GO

UPDATE dbo.Showtimes
SET Status = N'Đang hoạt động'
WHERE Status IN (N'Ðang ho?t d?ng', N'Active');
GO

ALTER TABLE dbo.Showtimes
    ADD CONSTRAINT DF_Showtimes_Status
    DEFAULT (N'Đang hoạt động') FOR Status;
GO