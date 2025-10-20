# 🚢 Hệ Thống Đặt Vé Tàu Cao Tốc HC1

Hệ thống đặt vé tàu cao tốc hiện đại, xây dựng với Node.js, Express, React và Supabase.

## ✨ Tính Năng

### 🎫 Khách Hàng
- ✅ Chọn tuyến, ngày và giờ khởi hành
- ✅ Nhập thông tin người đặt vé
- ✅ Quản lý danh sách hành khách (thêm/xóa)
- ✅ Tính giá vé tự động theo độ tuổi và loại ghế
- ✅ Xác nhận và thanh toán
- ✅ Nhận email xác nhận tự động
- ✅ Chuyển hướng Zalo để liên hệ

### 🔧 Admin Dashboard
- ✅ Thống kê tổng quan (đơn, doanh thu)
- ✅ Quản lý đơn đặt vé (filter, xem chi tiết, cập nhật trạng thái)
- ✅ Quản lý tuyến đường
- ✅ Xem danh sách hành khách theo đơn

### 💰 Logic Tính Giá Thông Minh
- 🎁 Miễn phí: Dưới 6 tuổi
- 👶 Trẻ em: 6-11 tuổi
- 👤 Người lớn: 12-59 tuổi
- 👴 Cao tuổi: 60+ tuổi (chỉ người Việt Nam)
- 💎 Ghế VIP: Giá riêng
- 📅 Giá cuối tuần khác ngày thường
- 🚢 Phí cảng được tính tự động

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React (Vanilla - không cần build)
- **Styling**: Tailwind CSS
- **Email**: Nodemailer

## 📦 Cài Đặt

### 1. Clone Project

```bash
# Project đã có sẵn tại thư mục hiện tại
cd /tmp/cc-agent/58918752/project
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

### 3. Cấu Hình Environment Variables

File `.env` đã được tạo sẵn với Supabase credentials. Nếu muốn bật email, thêm:

```env
# SMTP Email (Optional - để gửi email xác nhận)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Lưu ý**: Nếu không cấu hình SMTP, hệ thống vẫn hoạt động bình thường, chỉ không gửi email.

### 4. Khởi Động Server

```bash
node server.js
```

Server sẽ chạy tại: **http://localhost:3000**

## 🌐 Sử Dụng

### Khách Hàng - Đặt Vé
Truy cập: **http://localhost:3000**

**Quy trình đặt vé:**
1. **Bước 1**: Chọn tuyến, ngày đi, giờ khởi hành
2. **Bước 2**: Nhập thông tin người đặt (email, tên, SĐT, số lượng người)
3. **Bước 3**: Nhập thông tin từng hành khách (tên, năm sinh, quốc tịch, loại ghế)
4. **Bước 4**: Xác nhận và xem thông tin chuyển khoản

### Admin Dashboard
Truy cập: **http://localhost:3000/admin.html**

**Chức năng:**
- 📊 Xem thống kê tổng quan
- 📋 Quản lý đơn đặt vé (filter theo trạng thái, ngày, tuyến)
- ✅ Cập nhật trạng thái thanh toán (Chờ TT → Đã TT hoặc Hủy)
- 👁️ Xem chi tiết đơn và danh sách hành khách
- 🚢 Xem danh sách tuyến đang hoạt động

## 📊 Database Schema

### Bảng `ferry_routes` (Tuyến đường)
- `id` - UUID
- `route_slug` - Slug tuyến (unique)
- `route_name` - Tên tuyến
- `departure_times` - Giờ khởi hành (JSON array)
- `pricing` - Bảng giá (JSON object)
- `status` - Trạng thái (active/inactive)

### Bảng `ferry_bookings` (Đơn đặt vé)
- `id` - UUID
- `booking_code` - Mã đặt vé (unique, format: FB{timestamp})
- `route_id` - ID tuyến
- `travel_date` - Ngày đi
- `departure_time` - Giờ khởi hành
- `booker_name`, `booker_email`, `booker_phone` - Thông tin người đặt
- `passenger_count` - Số lượng hành khách
- `special_requests` - Yêu cầu đặc biệt
- `total_amount` - Tổng tiền
- `payment_status` - Trạng thái (pending/paid/cancelled)

### Bảng `ferry_passengers` (Hành khách)
- `id` - UUID
- `booking_id` - ID đơn đặt vé
- `passenger_name` - Tên hành khách
- `birth_year` - Năm sinh
- `nationality` - Quốc tịch
- `id_number` - Số CMND/Passport
- `seat_type` - Loại ghế (standard/vip)
- `ticket_price` - Giá vé

### Bảng `ferry_settings` (Cài đặt)
- `id` - UUID
- `setting_key` - Key (unique)
- `setting_value` - Giá trị
- `setting_type` - Loại

## 🔐 Bảo Mật

- ✅ Row Level Security (RLS) enabled cho tất cả bảng
- ✅ Public có thể đọc routes active và tạo booking
- ✅ Chỉ authenticated users có thể quản lý (admin)
- ✅ Prepared statements cho SQL queries
- ✅ Input validation và sanitization

## 📧 Email Template

Email xác nhận được gửi tự động sau khi đặt vé thành công, bao gồm:
- ✉️ Mã đặt vé
- 🚢 Thông tin chuyến
- 👤 Thông tin người đặt
- 👥 Danh sách hành khách
- 💰 Tổng tiền
- 💳 Thông tin chuyển khoản
- ⚠️ Lưu ý quan trọng

## 🚀 Deploy

### Vercel (Recommended)
```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Railway
```bash
# Cài Railway CLI
npm i -g @railway/cli

# Login và deploy
railway login
railway up
```

### Heroku
```bash
# Cài Heroku CLI
npm i -g heroku

# Deploy
heroku create ferry-booking-hc1
git push heroku main
```

## 📝 API Endpoints

### Public APIs
- `GET /` - Trang chủ
- `GET /api/routes` - Lấy danh sách tuyến
- `POST /api/bookings` - Tạo đơn đặt vé
- `GET /api/bookings/:code` - Xem đơn đặt vé
- `GET /api/settings` - Lấy cài đặt

### Admin APIs
- `GET /api/admin/bookings` - Lấy danh sách đơn (có filter)
- `PATCH /api/admin/bookings/:id` - Cập nhật trạng thái đơn

## 🎨 Customization

### Thay Đổi Màu Sắc
Chỉnh sửa file `public/css/style.css` hoặc sử dụng Tailwind classes trong HTML.

### Thêm Tuyến Mới
Vào Supabase Dashboard → Table `ferry_routes` → Insert row mới.

### Cập Nhật Email Template
Chỉnh sửa function `sendConfirmationEmail` trong file `server.js`.

## ❓ FAQ

**Q: Làm sao để test email?**
A: Dùng Gmail App Password hoặc dịch vụ SMTP test như Mailtrap.io

**Q: Làm sao để thêm authentication cho admin?**
A: Sử dụng Supabase Auth hoặc thêm middleware authentication vào Express.

**Q: Có thể xuất Excel danh sách hành khách không?**
A: Có, cài thêm package `xlsx` và implement export function.

**Q: Có thể tích hợp thanh toán online không?**
A: Có, tích hợp với VNPay, MoMo, ZaloPay bằng cách thêm payment gateway.

## 🤝 Hỗ Trợ

- 📧 Email: support@ferryboat.vn
- 💬 Zalo: 0336450470

## 📄 License

MIT License - Free to use for personal and commercial projects.

---

**Phát triển bởi HC1 Team** 🚢
