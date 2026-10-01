Use CinemaDB
GO
CREATE TABLE users(
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'Customer',
    CreatedAt DATETIME DEFAULT GETDATE()
);
go
ALTER TABLE Users
ADD Phone NVARCHAR(20) NOT NULL DEFAULT '';
GO
CREATE TABLE Movies
(
    MovieId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Genre NVARCHAR(100) NULL,
    Duration INT NOT NULL,
    ReleaseDate DATE NULL,
    Director NVARCHAR(150) NULL,
    AgeRating VARCHAR(10) NULL,
    PosterUrl NVARCHAR(500) NULL,
    TrailerUrl NVARCHAR(500) NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'ComingSoon',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
USE CinemaDB;
GO
CREATE TABLE Showtimes
(
    ShowtimeId INT IDENTITY(1,1) PRIMARY KEY,

    MovieId INT NOT NULL,

    RoomId INT NOT NULL,

    ShowDate DATE NOT NULL,

    StartTime TIME NOT NULL,

    EndTime TIME NOT NULL,

    TicketPrice DECIMAL(18,2) NOT NULL,

    Status VARCHAR(20) NOT NULL
        DEFAULT 'Active',

    CreatedAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    CONSTRAINT FK_Showtimes_Movies
        FOREIGN KEY (MovieId)
        REFERENCES Movies(MovieId),

    CONSTRAINT UQ_Showtimes_RoomDateTime
        UNIQUE (
            RoomId,
            ShowDate,
            StartTime
        )
);
GO
USE CinemaDB;
GO

CREATE TABLE Seats
(
    SeatId INT IDENTITY(1,1) PRIMARY KEY,

    RoomId INT NOT NULL,

    SeatCode VARCHAR(10) NOT NULL,

    RowName VARCHAR(5) NOT NULL,

    SeatNumber INT NOT NULL,

    SeatType VARCHAR(30) NOT NULL
        DEFAULT 'Normal',

    CONSTRAINT FK_Seats_Rooms
        FOREIGN KEY (RoomId)
        REFERENCES Rooms(RoomId),

    CONSTRAINT UQ_Seats_Room_SeatCode
        UNIQUE (RoomId, SeatCode)
);
GO
USE CinemaDB;
GO
CREATE TABLE Cinemas
(
    CinemaId INT IDENTITY(1,1) PRIMARY KEY,

    Name NVARCHAR(200) NOT NULL,

    Address NVARCHAR(300) NOT NULL,

    Phone NVARCHAR(20) NULL,

    Status NVARCHAR(30) NOT NULL
        DEFAULT N'Đang hoạt động',

    CreatedAt DATETIME NOT NULL
        DEFAULT GETDATE()
);
GO
CREATE TABLE Rooms
(
    RoomId INT IDENTITY(1,1) PRIMARY KEY,
    CinemaId INT NOT NULL,
    RoomName NVARCHAR(100) NOT NULL,
    Capacity INT NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'Active',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Rooms_Cinemas
        FOREIGN KEY (CinemaId)
        REFERENCES Cinemas(CinemaId)
);
GO
USE CinemaDB;
GO

CREATE TABLE Tickets
(
    TicketId INT IDENTITY(1,1) PRIMARY KEY,

    UserId INT NOT NULL,

    MovieId INT NOT NULL,

    ShowtimeId INT NOT NULL,

    SeatId INT NOT NULL,

    TicketPrice DECIMAL(18,2) NOT NULL,

    Status NVARCHAR(30) NOT NULL
        DEFAULT N'Đã đặt',

    CreatedAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    CONSTRAINT FK_Tickets_Users
        FOREIGN KEY (UserId)
        REFERENCES Users(UserId),

    CONSTRAINT FK_Tickets_Movies
        FOREIGN KEY (MovieId)
        REFERENCES Movies(MovieId),

    CONSTRAINT FK_Tickets_Showtimes
        FOREIGN KEY (ShowtimeId)
        REFERENCES Showtimes(ShowtimeId),

    CONSTRAINT FK_Tickets_Seats
        FOREIGN KEY (SeatId)
        REFERENCES Seats(SeatId)
);
GO