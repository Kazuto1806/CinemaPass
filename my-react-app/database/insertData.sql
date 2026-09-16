USE CinemaDB;
GO

INSERT INTO Users
    (FullName, Email, Phone, PasswordHash, Role)
VALUES
    (N'Admin', 'admin@cinemapass.com', '0987654321', 'admin123', 'Admin');
GO