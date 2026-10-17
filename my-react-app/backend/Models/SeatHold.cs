
namespace CinemaBackend.Models
{
    public class SeatHold
    {
        public int SeatHoldId { get; set; }

        // Suất chiếu đang giữ ghế
        public int ShowtimeId { get; set; }

        // Ghế đang được giữ
        public int SeatId { get; set; }

        // Mã nhận diện phiên giữ ghế của khách
        public string HoldToken { get; set; } = string.Empty;

        // Tài khoản khách, có thể chưa đăng nhập
        public int? UserId { get; set; }

        // Thời điểm hết hạn giữ ghế theo UTC
        public DateTime ExpiresAtUtc { get; set; }

        // Thời điểm bắt đầu giữ ghế theo UTC
        public DateTime CreatedAtUtc { get; set; }
    }
}
