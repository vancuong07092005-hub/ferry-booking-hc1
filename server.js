/**
 * HỆ THỐNG ĐẶT VÉ TÀU CAO TỐC HC1
 * Backend API Server - Express + Supabase
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Khởi tạo Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Khởi tạo Email transporter (với timeout ngắn để tránh chặn)
let emailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch (error) {
    console.warn('⚠️ Email transporter không khởi tạo được:', error.message);
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Tính tuổi từ năm sinh
 */
function calculateAge(birthYear) {
  return new Date().getFullYear() - birthYear;
}

/**
 * Kiểm tra cuối tuần
 */
function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Tính giá vé cho hành khách
 */
function calculateTicketPrice(passenger, route, travelDate) {
  const age = calculateAge(passenger.birth_year);

  // Miễn phí dưới 6 tuổi
  if (age < 6) return 0;

  const pricing = route.pricing;
  const weekend = isWeekend(travelDate);

  // VIP
  if (passenger.seat_type === 'vip') {
    return (pricing.vip.price || 0) + (pricing.vip.portFee || 0);
  }

  // Trẻ em (6-11)
  if (age <= 11) {
    const basePrice = weekend && pricing.child.weekendPrice
      ? pricing.child.weekendPrice
      : (pricing.child.weekdayPrice || pricing.child.price || 0);
    return basePrice + (pricing.child.portFee || 0);
  }

  // Cao tuổi (>=60) - chỉ người Việt Nam
  if (age >= 60 && passenger.nationality === 'Vietnam') {
    const basePrice = weekend && pricing.senior.weekendPrice
      ? pricing.senior.weekendPrice
      : (pricing.senior.weekdayPrice || pricing.senior.price || 0);
    return basePrice + (pricing.senior.portFee || 0);
  }

  // Người lớn
  const basePrice = weekend && pricing.adult.weekendPrice
    ? pricing.adult.weekendPrice
    : (pricing.adult.weekdayPrice || pricing.adult.price || 0);
  return basePrice + (pricing.adult.portFee || 0);
}

/**
 * Format tiền VND
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Tạo mã booking unique
 */
function generateBookingCode() {
  return 'FB' + Date.now();
}

/**
 * Gửi email xác nhận
 */
async function sendConfirmationEmail(booking, passengers, route, settings) {
  const settingsMap = {};
  settings.forEach(s => {
    settingsMap[s.setting_key] = s.setting_value;
  });

  const passengerList = passengers.map((p, i) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.passenger_name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${calculateAge(p.birth_year)} tuổi</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.nationality}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.seat_type === 'vip' ? 'VIP' : 'Phổ thông'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${formatCurrency(p.ticket_price)}</td>
    </tr>
  `).join('');

  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section h3 { margin-top: 0; color: #2563EB; border-bottom: 2px solid #2563EB; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #2563EB; color: white; padding: 10px; text-align: left; }
        .total { background: #16A34A; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; margin: 20px 0; }
        .bank-info { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight { background: #DBEAFE; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚢 XÁC NHẬN ĐẶT VÉ TÀU CAO TỐC</h1>
          <p style="font-size: 18px; margin: 10px 0;">Mã đặt vé: <span class="highlight">${booking.booking_code}</span></p>
        </div>

        <div class="content">
          <div class="section">
            <h3>📋 THÔNG TIN CHUYẾN</h3>
            <p><strong>Tuyến:</strong> ${route.route_name}</p>
            <p><strong>Ngày đi:</strong> ${new Date(booking.travel_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Giờ khởi hành:</strong> ${booking.departure_time}</p>
          </div>

          <div class="section">
            <h3>👤 NGƯỜI ĐẶT VÉ</h3>
            <p><strong>Họ tên:</strong> ${booking.booker_name}</p>
            <p><strong>Email:</strong> ${booking.booker_email}</p>
            <p><strong>Số điện thoại:</strong> ${booking.booker_phone}</p>
            ${booking.special_requests ? `<p><strong>Yêu cầu đặc biệt:</strong> ${booking.special_requests}</p>` : ''}
          </div>

          <div class="section">
            <h3>👥 DANH SÁCH HÀNH KHÁCH (${passengers.length} người)</h3>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ tên</th>
                  <th>Tuổi</th>
                  <th>Quốc tịch</th>
                  <th>Loại ghế</th>
                  <th>Giá vé</th>
                </tr>
              </thead>
              <tbody>
                ${passengerList}
              </tbody>
            </table>
          </div>

          <div class="total">
            💰 TỔNG THANH TOÁN: ${formatCurrency(booking.total_amount)}
          </div>

          <div class="bank-info">
            <h3 style="color: #F59E0B; margin-top: 0;">💳 THÔNG TIN CHUYỂN KHOẢN</h3>
            <p><strong>Ngân hàng:</strong> ${settingsMap.bank_name || 'N/A'}</p>
            <p><strong>Chủ tài khoản:</strong> ${settingsMap.bank_account_name || 'N/A'}</p>
            <p><strong>Số tài khoản:</strong> ${settingsMap.bank_account_number || 'N/A'}</p>
            <p><strong>Số tiền:</strong> <span style="color: #DC2626; font-size: 18px; font-weight: bold;">${formatCurrency(booking.total_amount)}</span></p>
            <p><strong>Nội dung CK:</strong> <span style="color: #2563EB;">${booking.booker_name} ${booking.booker_phone}</span></p>
          </div>

          <div class="section">
            <h3>⚠️ LƯU Ý QUAN TRỌNG</h3>
            <ul>
              <li>Vui lòng chuyển khoản đúng số tiền và nội dung để được xác nhận nhanh nhất</li>
              <li>Sau khi chuyển khoản, vui lòng liên hệ Zalo: <strong>${settingsMap.zalo_phone || 'N/A'}</strong> để xác nhận</li>
              <li>Vé sẽ được gửi qua email sau khi xác nhận thanh toán</li>
              <li>Mang theo CMND/Passport khi lên tàu</li>
              <li>Có mặt tại cảng trước giờ khởi hành 30 phút</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          <p>🚢 Hệ Thống Đặt Vé Tàu Cao Tốc HC1</p>
          <p>Email: ${settingsMap.email_from || 'booking@ferryboat.vn'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!emailTransporter) {
    console.warn('⚠️ Email transporter không khả dụng - Bỏ qua gửi email');
    return { success: false, error: 'Email service not available' };
  }

  try {
    await emailTransporter.sendMail({
      from: settingsMap.email_from || 'booking@ferryboat.vn',
      to: booking.booker_email,
      subject: `Xác nhận đặt vé tàu cao tốc - Mã ${booking.booking_code}`,
      html: emailHTML
    });
    return { success: true };
  } catch (error) {
    console.warn('⚠️ Không gửi được email:', error.message);
    return { success: false, error: error.message };
  }
}

// =====================================================
// API ROUTES
// =====================================================

/**
 * GET / - Trang chủ
 */
app.get('/', (req, res) => {
  res.send(`
    <h1>🚢 Ferry Booking System API</h1>
    <p>Server đang chạy!</p>
    <h3>Endpoints:</h3>
    <ul>
      <li>GET /api/routes - Lấy danh sách tuyến</li>
      <li>POST /api/bookings - Tạo đơn đặt vé</li>
      <li>GET /api/bookings/:code - Xem đơn đặt vé</li>
      <li>GET /api/settings - Lấy cài đặt</li>
      <li>GET /admin - Admin dashboard</li>
    </ul>
  `);
});

/**
 * GET /api/routes - Lấy danh sách tuyến đang hoạt động
 */
app.get('/api/routes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ferry_routes')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bookings - Tạo đơn đặt vé mới
 */
app.post('/api/bookings', async (req, res) => {
  try {
    const { route_id, travel_date, departure_time, booker_name, booker_email,
            booker_phone, passenger_count, special_requests, passengers } = req.body;

    // Validate dữ liệu
    if (!route_id || !travel_date || !departure_time || !booker_name ||
        !booker_email || !booker_phone || !passengers || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bắt buộc'
      });
    }

    // Lấy thông tin tuyến
    const { data: route, error: routeError } = await supabase
      .from('ferry_routes')
      .select('*')
      .eq('id', route_id)
      .single();

    if (routeError || !route) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tuyến'
      });
    }

    // Tính giá vé cho từng hành khách
    const passengersWithPrice = passengers.map(p => ({
      ...p,
      ticket_price: calculateTicketPrice(p, route, travel_date)
    }));

    // Tính tổng tiền
    const total_amount = passengersWithPrice.reduce((sum, p) => sum + p.ticket_price, 0);

    // Tạo mã booking
    const booking_code = generateBookingCode();

    // Lưu booking vào database
    const { data: booking, error: bookingError } = await supabase
      .from('ferry_bookings')
      .insert({
        booking_code,
        route_id,
        travel_date,
        departure_time,
        booker_name,
        booker_email,
        booker_phone,
        passenger_count: passengers.length,
        special_requests,
        total_amount,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Lưu thông tin hành khách
    const passengersData = passengersWithPrice.map(p => ({
      booking_id: booking.id,
      passenger_name: p.name,
      birth_year: p.birth_year,
      nationality: p.nationality,
      id_number: p.id_number || '',
      seat_type: p.seat_type,
      ticket_price: p.ticket_price
    }));

    const { data: savedPassengers, error: passengersError } = await supabase
      .from('ferry_passengers')
      .insert(passengersData)
      .select();

    if (passengersError) throw passengersError;

    // Lấy settings để gửi email
    const { data: settings } = await supabase
      .from('ferry_settings')
      .select('*');

    // Gửi email xác nhận (không chặn response, bỏ qua nếu lỗi)
    if (emailTransporter) {
      sendConfirmationEmail(booking, savedPassengers, route, settings || [])
        .catch(err => console.warn('⚠️ Email không gửi được (bỏ qua):', err.message));
    } else {
      console.warn('⚠️ Email service không khả dụng - Tiếp tục không có email');
    }

    res.json({
      success: true,
      data: {
        booking,
        passengers: savedPassengers,
        route
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bookings/:code - Xem chi tiết đơn đặt vé
 */
app.get('/api/bookings/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Lấy thông tin booking
    const { data: booking, error: bookingError } = await supabase
      .from('ferry_bookings')
      .select('*, ferry_routes(*)')
      .eq('booking_code', code)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy đơn đặt vé'
      });
    }

    // Lấy danh sách hành khách
    const { data: passengers } = await supabase
      .from('ferry_passengers')
      .select('*')
      .eq('booking_id', booking.id);

    res.json({
      success: true,
      data: { booking, passengers: passengers || [] }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings - Lấy cài đặt hệ thống
 */
app.get('/api/settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ferry_settings')
      .select('*');

    if (error) throw error;

    // Convert array to object
    const settingsObj = {};
    (data || []).forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/bookings - Lấy danh sách đơn (cho admin)
 */
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const { status, date, route_id } = req.query;

    let query = supabase
      .from('ferry_bookings')
      .select('*, ferry_routes(route_name)');

    if (status) query = query.eq('payment_status', status);
    if (date) query = query.eq('travel_date', date);
    if (route_id) query = query.eq('route_id', route_id);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/admin/bookings/:id - Cập nhật trạng thái đơn
 */
app.patch('/api/admin/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!['pending', 'paid', 'cancelled'].includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái không hợp lệ'
      });
    }

    const { data, error } = await supabase
      .from('ferry_bookings')
      .update({ payment_status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚢 Ferry Booking System API`);
  console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📊 Database: Supabase (Connected)`);
  console.log(`📧 Email: ${process.env.SMTP_USER ? 'Configured' : 'Not configured'}\n`);
});
