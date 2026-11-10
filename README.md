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

Swagger và quyền API:
- Swagger công khai, chỉ xem tài liệu và tắt chức năng gửi request từ giao diện. Mở `https://api.cinemapass.id.vn/swagger/index.html` sau khi deploy backend.
- Cấu hình `Jwt__Key`, `Jwt__Issuer` và `Jwt__Audience` cho backend; không commit các giá trị bí mật vào repository.
- Đăng nhập bằng `POST /api/auth/login`, sau đó dùng `accessToken` trả về trong nút **Authorize** của Swagger với dạng Bearer token. API quản trị yêu cầu tài khoản có role `Admin`.
- Các API ghi dữ liệu vẫn được bảo vệ ở backend; một số thao tác khách hàng yêu cầu đăng nhập. Tắt chức năng gửi request trong Swagger không thay thế phân quyền API.
- API đăng ký và đăng nhập vẫn công khai theo thiết kế. Các API khác vẫn cần thông tin xác thực tương ứng nếu được gọi trực tiếp ngoài Swagger.