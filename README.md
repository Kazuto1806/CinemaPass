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
- Swagger chỉ bật khi backend chạy ở môi trường Development. Cấu hình `SWAGGER_USERNAME` và `SWAGGER_PASSWORD` bằng biến môi trường để mở giao diện Swagger.
- Cấu hình `Jwt__Key`, `Jwt__Issuer` và `Jwt__Audience` cho backend; không commit các giá trị bí mật vào repository.
- Đăng nhập bằng `POST /api/auth/login`, sau đó dùng `accessToken` trả về trong nút **Authorize** của Swagger với dạng Bearer token. API quản trị yêu cầu tài khoản có role `Admin`.