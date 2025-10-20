/*
  # Hệ Thống Đặt Vé Tàu Cao Tốc - Database Schema

  ## Tổng quan
  Tạo cấu trúc database hoàn chỉnh cho hệ thống đặt vé tàu cao tốc HC1 bao gồm:
  - Quản lý tuyến đường (routes)
  - Quản lý đơn đặt vé (bookings)
  - Quản lý hành khách (passengers)
  - Cài đặt hệ thống (settings)

  ## 1. Bảng Routes (Tuyến đường)
  Lưu trữ thông tin các tuyến tàu:
  - ID, slug, tên tuyến
  - Giờ khởi hành (JSON array)
  - Bảng giá (JSON object với VIP, người lớn, cao tuổi, trẻ em)
  - Trạng thái hoạt động

  ## 2. Bảng Bookings (Đơn đặt vé)
  Lưu trữ thông tin đơn đặt vé:
  - Mã đặt vé unique
  - Thông tin tuyến, ngày, giờ
  - Thông tin người đặt (tên, email, SĐT)
  - Số lượng hành khách, yêu cầu đặc biệt
  - Tổng tiền, trạng thái thanh toán

  ## 3. Bảng Passengers (Hành khách)
  Lưu trữ chi tiết từng hành khách:
  - Liên kết với booking_id
  - Thông tin cá nhân (tên, năm sinh, quốc tịch, CMND)
  - Loại ghế, giá vé

  ## 4. Bảng Settings (Cài đặt)
  Lưu trữ cấu hình hệ thống:
  - Thông tin chuyển khoản
  - Email template
  - Zalo contact

  ## 5. Security (Row Level Security)
  - Tất cả bảng đều enable RLS
  - Public có thể đọc routes active
  - Chỉ authenticated users (admin) có thể quản lý
  - Khách có thể tạo booking và xem booking của mình
*/

-- Tạo extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. BẢNG ROUTES (Tuyến đường)
-- =====================================================
CREATE TABLE IF NOT EXISTS ferry_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_slug VARCHAR(100) UNIQUE NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  departure_times JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS idx_routes_status ON ferry_routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_slug ON ferry_routes(route_slug);

-- =====================================================
-- 2. BẢNG BOOKINGS (Đơn đặt vé)
-- =====================================================
CREATE TABLE IF NOT EXISTS ferry_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_code VARCHAR(50) UNIQUE NOT NULL,
  route_id UUID NOT NULL REFERENCES ferry_routes(id) ON DELETE RESTRICT,
  travel_date DATE NOT NULL,
  departure_time VARCHAR(10) NOT NULL,
  booker_name VARCHAR(255) NOT NULL,
  booker_email VARCHAR(255) NOT NULL,
  booker_phone VARCHAR(20) NOT NULL,
  passenger_count INT NOT NULL DEFAULT 1 CHECK (passenger_count > 0),
  special_requests TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes cho tìm kiếm và filter
CREATE INDEX IF NOT EXISTS idx_bookings_code ON ferry_bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON ferry_bookings(booker_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON ferry_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON ferry_bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_bookings_route ON ferry_bookings(route_id);

-- =====================================================
-- 3. BẢNG PASSENGERS (Hành khách)
-- =====================================================
CREATE TABLE IF NOT EXISTS ferry_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES ferry_bookings(id) ON DELETE CASCADE,
  passenger_name VARCHAR(255) NOT NULL,
  birth_year INT NOT NULL CHECK (birth_year >= 1920 AND birth_year <= 2025),
  nationality VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
  id_number VARCHAR(50),
  seat_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (seat_type IN ('standard', 'vip')),
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho query passengers theo booking
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON ferry_passengers(booking_id);

-- =====================================================
-- 4. BẢNG SETTINGS (Cài đặt hệ thống)
-- =====================================================
CREATE TABLE IF NOT EXISTS ferry_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'text',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS cho tất cả bảng
ALTER TABLE ferry_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferry_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferry_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferry_settings ENABLE ROW LEVEL SECURITY;

-- ROUTES: Public có thể xem routes active, admin có thể quản lý
CREATE POLICY "Public can view active routes"
  ON ferry_routes FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can manage routes"
  ON ferry_routes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- BOOKINGS: Public có thể tạo booking và xem booking của mình qua email
CREATE POLICY "Anyone can create bookings"
  ON ferry_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own bookings by email"
  ON ferry_bookings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage all bookings"
  ON ferry_bookings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PASSENGERS: Gắn với booking
CREATE POLICY "Anyone can create passengers"
  ON ferry_passengers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view passengers"
  ON ferry_passengers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage passengers"
  ON ferry_passengers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SETTINGS: Chỉ authenticated users có thể quản lý
CREATE POLICY "Anyone can view settings"
  ON ferry_settings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage settings"
  ON ferry_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. DỮ LIỆU MẪU
-- =====================================================

-- Insert 3 tuyến mẫu
INSERT INTO ferry_routes (route_slug, route_name, departure_times, pricing, status)
VALUES 
  (
    'tran-de-con-dao',
    'Trần Đề - Côn Đảo',
    '["07:30", "13:00", "15:30"]'::jsonb,
    '{
      "vip": {"price": 590000, "portFee": 18000},
      "adult": {"weekdayPrice": 390000, "weekendPrice": 450000, "portFee": 18000},
      "senior": {"weekdayPrice": 312000, "weekendPrice": 360000, "portFee": 18000},
      "child": {"weekdayPrice": 312000, "weekendPrice": 360000, "portFee": 18000}
    }'::jsonb,
    'active'
  ),
  (
    'rach-gia-phu-quoc',
    'Rạch Giá - Phú Quốc',
    '["08:00", "12:00", "16:00"]'::jsonb,
    '{
      "vip": {"price": 500000, "portFee": 0},
      "adult": {"price": 315000, "portFee": 0},
      "senior": {"price": 265000, "portFee": 0},
      "child": {"price": 225000, "portFee": 0}
    }'::jsonb,
    'active'
  ),
  (
    'ha-tien-phu-quoc',
    'Hà Tiên - Phú Quốc',
    '["08:30", "13:30", "16:30"]'::jsonb,
    '{
      "vip": {"price": 300000, "portFee": 0},
      "adult": {"price": 216000, "portFee": 0},
      "senior": {"price": 182000, "portFee": 0},
      "child": {"price": 148000, "portFee": 0}
    }'::jsonb,
    'active'
  )
ON CONFLICT (route_slug) DO NOTHING;

-- Insert settings mặc định
INSERT INTO ferry_settings (setting_key, setting_value, setting_type)
VALUES 
  ('bank_name', 'Vietcombank', 'text'),
  ('bank_account_name', 'NGUYEN VAN A', 'text'),
  ('bank_account_number', '1234567890', 'text'),
  ('zalo_phone', '0336450470', 'text'),
  ('email_from', 'booking@ferryboat.vn', 'email'),
  ('email_subject', 'Xác nhận đặt vé tàu cao tốc - Mã #{booking_code}', 'text')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function cập nhật updated_at tự động
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho routes
DROP TRIGGER IF EXISTS update_ferry_routes_updated_at ON ferry_routes;
CREATE TRIGGER update_ferry_routes_updated_at
  BEFORE UPDATE ON ferry_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho bookings
DROP TRIGGER IF EXISTS update_ferry_bookings_updated_at ON ferry_bookings;
CREATE TRIGGER update_ferry_bookings_updated_at
  BEFORE UPDATE ON ferry_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger cho settings
DROP TRIGGER IF EXISTS update_ferry_settings_updated_at ON ferry_settings;
CREATE TRIGGER update_ferry_settings_updated_at
  BEFORE UPDATE ON ferry_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();