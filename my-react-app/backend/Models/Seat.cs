namespace CinemaBackend.Models
{
    public class Seat
    {
        public int SeatId { get; set; }

        public int RoomId { get; set; }

        public string SeatCode { get; set; } = string.Empty;

        public string RowName { get; set; } = string.Empty;

        public int SeatNumber { get; set; }

        public string SeatType { get; set; } = "Normal";

        // Quan hệ với phòng chiếu
        public Room? Room { get; set; }
    }
}