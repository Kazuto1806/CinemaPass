cd D:\HeThongQuanLyvexemphim\CinemaPass\my-react-app
npm run dev

cd D:\DoAn\CinemaPass\my-react-app
npm run dev

update code lên github:
git add .
git commit -m "Update code"
git push

Lấy code từ github về: git pull

chạy code: Start-Process ".\Start.bat"

Tối ưu ảnh:
- Ảnh gốc được giữ nguyên; các bản WebP tối ưu nằm trong `my-react-app/src/assets/optimized/`.
- Khi cập nhật ảnh nguồn, chạy `npm run optimize:images` trong thư mục `my-react-app` rồi build và deploy lại frontend.
- Khi admin tải poster phim lên, backend yêu cầu Cloudinary tạo sẵn bản WebP 260, 390 và 520 px; website dùng bản phù hợp và vẫn dự phòng ảnh gốc.

Swagger và quyền API:
- Swagger công khai, chỉ xem tài liệu và tắt chức năng gửi request từ giao diện. Mở `https://api.cinemapass.id.vn/swagger/index.html` sau khi deploy backend.
- Cấu hình `Jwt__Key`, `Jwt__Issuer` và `Jwt__Audience` cho backend; không commit các giá trị bí mật vào repository.
- Đăng nhập bằng `POST /api/auth/login`, sau đó dùng `accessToken` trả về trong nút **Authorize** của Swagger với dạng Bearer token. API quản trị yêu cầu tài khoản có role `Admin`.
- Các API ghi dữ liệu vẫn được bảo vệ ở backend; một số thao tác khách hàng yêu cầu đăng nhập. Tắt chức năng gửi request trong Swagger không thay thế phân quyền API.
- API ghi dữ liệu không nhận khóa chính của bản ghi từ request; `UserId` của đặt vé/đơn hàng được lấy từ JWT. Các mã liên kết như `MovieId`, `RoomId`, `FoodId` vẫn được dùng khi cần chọn dữ liệu liên quan.
- API đăng ký và đăng nhập vẫn công khai theo thiết kế. Các API khác vẫn cần thông tin xác thực tương ứng nếu được gọi trực tiếp ngoài Swagger.