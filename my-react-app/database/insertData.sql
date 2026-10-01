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
    '/assets/bat-tien.jpeg',
    'NowShowing'
);
USE CinemaDB;
GO

INSERT INTO Cinemas
(
    Name,
    Address,
    Phone,
    Status
)
VALUES
(
    N'Cinema Pass Quận 1',
    N'123 Nguyễn Huệ, Quận 1, TP.HCM',
    N'0900000001',
    N'Đang hoạt động'
),
(
    N'Cinema Pass Quận 7',
    N'456 Nguyễn Thị Thập, Quận 7, TP.HCM',
    N'0900000002',
    N'Đang hoạt động'
),
(
    N'Cinema Pass Tân Bình',
    N'789 Cộng Hòa, Tân Bình, TP.HCM',
    N'0900000003',
    N'Đang hoạt động'
);
GO
USE CinemaDB;
GO

INSERT INTO Rooms
(
    CinemaId,
    RoomName,
    Capacity,
    Status
)
VALUES
(1, N'Phòng 01', 100, N'Đang hoạt động'),
(1, N'Phòng 02', 120, N'Đang hoạt động'),
(1, N'Phòng VIP', 60, N'Đang hoạt động'),

(2, N'Phòng 01', 100, N'Đang hoạt động'),
(2, N'Phòng 02', 80, N'Đang hoạt động'),

(3, N'Phòng 01', 100, N'Đang hoạt động'),
(3, N'Phòng 02', 100, N'Đang hoạt động');
GO