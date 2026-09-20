USE CinemaDB;
GO

INSERT INTO Users
    (FullName, Email, Phone, PasswordHash, Role)
VALUES
    (N'Admin', 'admin@cinemapass.com', '0987654321', 'admin123', 'Admin');
GO
INSERT INTO Movies
(
    Title,
    Description,
    Genre,
    Duration,
    ReleaseDate,
    Director,
    AgeRating,
    PosterUrl,
    Status
)
VALUES
(
    N'Bắt Tiên!',
    N'Một bộ phim hoạt hình phiêu lưu.',
    N'Hoạt hình, Hài',
    120,
    '2026-09-11',
    N'Mục Chí Dương',
    'K',
    '/assets/battien.jpg',
    'NowShowing'
);