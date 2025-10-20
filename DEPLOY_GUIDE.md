# 🚀 HƯỚNG DẪN DEPLOY LÊN RENDER.COM

## Bước 1: Chuẩn bị tài khoản GitHub

### 1.1. Tạo tài khoản GitHub (nếu chưa có)
- Truy cập: https://github.com
- Đăng ký tài khoản miễn phí

### 1.2. Tạo repository mới
1. Đăng nhập GitHub
2. Click nút **"+"** góc trên bên phải → **New repository**
3. **Repository name:** `ferry-booking-hc1`
4. Chọn **Public**
5. ✅ Check: **Add a README file**
6. Click **Create repository**

---

## Bước 2: Upload code lên GitHub

### Cách 1: Upload qua giao diện web (Dễ nhất)

1. Vào repository vừa tạo
2. Click **Add file** → **Upload files**
3. Kéo thả TẤT CẢ file/folder (trừ `node_modules`)
4. Scroll xuống → **Commit changes**

### Cách 2: Dùng Git command line

```bash
# Mở terminal trong thư mục project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ferry-booking-hc1.git
git push -u origin main
```

---

## Bước 3: Deploy lên Render.com

### 3.1. Đăng ký Render
1. Truy cập: https://render.com
2. Click **Get Started for Free**
3. Chọn **Sign up with GitHub** (khuyên dùng)
4. Cho phép Render truy cập GitHub

### 3.2. Tạo Web Service
1. Trong Render Dashboard
2. Click **New +** → **Web Service**
3. Click **Connect account** (nếu chưa kết nối GitHub)
4. Tìm repository: `ferry-booking-hc1`
5. Click **Connect**

### 3.3. Cấu hình service

**Name:** `ferry-booking-hc1` (hoặc tên bạn muốn)

**Region:** Singapore (gần Việt Nam nhất)

**Branch:** `main`

**Root Directory:** (để trống)

**Runtime:** `Node`

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Instance Type:** `Free`

### 3.4. Thêm Environment Variables

Scroll xuống phần **Environment Variables**, click **Add Environment Variable** và thêm:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://ykrtxgwbiqfefzqcugbo.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrcnR4Z3diaXFmZWZ6cWN1Z2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDMyNTUsImV4cCI6MjA3NjUxOTI1NX0.uK1_dEGqcaemuMKwQuJuJY9UxDNaS7yWdl1ZbrjpRlI` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `phuquocexpressbooking@gmail.com` |
| `SMTP_PASS` | `ppqwkjjoltbcmwht` |

### 3.5. Deploy!

1. Click **Create Web Service**
2. Đợi 2-3 phút để Render build và deploy
3. Khi thấy ✅ **Live**, website đã sẵn sàng!

---

## Bước 4: Truy cập website

Render sẽ cung cấp URL dạng:
```
https://ferry-booking-hc1.onrender.com
```

### Các trang:
- **Trang đặt vé:** `https://ferry-booking-hc1.onrender.com`
- **Trang admin:** `https://ferry-booking-hc1.onrender.com/admin.html`

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. Free tier của Render
- ✅ Miễn phí hoàn toàn
- ⏱️ Server "ngủ" sau 15 phút không sử dụng
- 🐌 Lần đầu truy cập sau khi ngủ sẽ chậm (30-60 giây)
- 📊 Giới hạn 750 giờ/tháng (đủ dùng)

### 2. Giữ server luôn "thức"
Nếu muốn server không ngủ, có thể:
- Upgrade lên Paid plan ($7/tháng)
- Hoặc dùng dịch vụ "ping" miễn phí như UptimeRobot (ping 5 phút/lần)

### 3. Cập nhật code
Mỗi khi push code mới lên GitHub:
→ Render tự động build và deploy lại!

---

## 🆘 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Build failed"
**Nguyên nhân:** Thiếu file hoặc lỗi cú pháp
**Giải pháp:**
- Kiểm tra logs trong Render Dashboard
- Đảm bảo `package.json` đúng format
- Đảm bảo đã upload đầy đủ file

### Lỗi: "Application failed to respond"
**Nguyên nhân:** Server không chạy đúng port
**Giải pháp:** Render tự động set PORT, code đã xử lý đúng rồi

### Lỗi: "Cannot connect to database"
**Nguyên nhân:** Thiếu Environment Variables
**Giải pháp:** Kiểm tra lại phần Environment Variables

---

## 📱 CHIA SẺ WEBSITE

Sau khi deploy thành công, bạn có thể:
1. Gửi link cho khách hàng đặt vé
2. Truy cập trang admin để quản lý
3. Nhúng vào website khác (nếu có)

---

## 🎉 HOÀN TẤT!

Website của bạn đã ONLINE và có thể truy cập từ bất kỳ đâu!

**Cần hỗ trợ?**
- Render Docs: https://render.com/docs
- GitHub Docs: https://docs.github.com
