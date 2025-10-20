/**
 * HỆ THỐNG ĐẶT VÉ TÀU CAO TỐC HC1
 * Frontend React Application
 */

const { useState, useEffect } = React;

// API Base URL
const API_URL = window.location.origin;

// Danh sách quốc gia
const COUNTRIES = [
  "Vietnam", "United States", "China", "Japan", "South Korea", "Thailand",
  "Singapore", "Malaysia", "Indonesia", "Philippines", "Cambodia", "Laos",
  "Myanmar", "Brunei", "India", "Australia", "New Zealand", "United Kingdom",
  "France", "Germany", "Italy", "Spain", "Canada", "Russia", "Brazil",
  "Mexico", "Argentina"
];

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function calculateAge(birthYear) {
  return new Date().getFullYear() - birthYear;
}

function isWeekend(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getAgeCategory(age) {
  if (age < 6) return 'Miễn phí (dưới 6 tuổi)';
  if (age <= 11) return 'Trẻ em (6-11 tuổi)';
  if (age <= 59) return 'Người lớn (12-59 tuổi)';
  return 'Người cao tuổi (60+ tuổi)';
}

function calculateTicketPrice(passenger, route, travelDate) {
  if (!route || !route.pricing) return 0;

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

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^(0|\+84)[0-9]{9,10}$/.test(phone);
}

// =====================================================
// MAIN APP COMPONENT
// =====================================================

function FerryBookingApp() {
  const [routes, setRoutes] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [bookingData, setBookingData] = useState({
    route_id: '',
    travel_date: '',
    departure_time: '',
    booker_name: '',
    booker_email: '',
    booker_phone: '',
    passenger_count: 1,
    special_requests: '',
    passengers: []
  });

  // Load routes và settings
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/routes`).then(r => r.json()),
      fetch(`${API_URL}/api/settings`).then(r => r.json())
    ])
      .then(([routesRes, settingsRes]) => {
        if (routesRes.success) setRoutes(routesRes.data);
        if (settingsRes.success) setSettings(settingsRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  }, []);

  const selectedRoute = routes.find(r => r.id === bookingData.route_id);

  const calculateTotal = () => {
    if (!selectedRoute) return 0;
    return bookingData.passengers.reduce((sum, p) => {
      return sum + calculateTicketPrice(p, selectedRoute, bookingData.travel_date);
    }, 0);
  };

  const handleNext = () => {
    if (step === 2 && bookingData.passengers.length === 0) {
      // Khởi tạo passengers
      const passengers = Array.from({ length: bookingData.passenger_count }, (_, i) => ({
        id: Date.now() + i,
        name: '',
        birth_year: 2000,
        nationality: 'Vietnam',
        id_number: '',
        seat_type: 'standard'
      }));
      setBookingData({ ...bookingData, passengers });
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Tính giá cho từng passenger
    const passengersWithPrice = bookingData.passengers.map(p => ({
      ...p,
      ticket_price: calculateTicketPrice(p, selectedRoute, bookingData.travel_date)
    }));

    const payload = {
      ...bookingData,
      passengers: passengersWithPrice
    };

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ĐẶT VÉ THÀNH CÔNG!\n\nMã đặt vé: ${result.data.booking.booking_code}\n\nEmail xác nhận đã được gửi đến: ${bookingData.booker_email}\n\nVui lòng kiểm tra email và chuyển khoản theo hướng dẫn.`);

        // Chuyển hướng đến Zalo
        if (settings.zalo_phone) {
          window.location.href = `https://zalo.me/${settings.zalo_phone}`;
        }
      } else {
        alert('❌ Có lỗi xảy ra: ' + result.error);
      }
    } catch (error) {
      alert('❌ Không thể kết nối đến server: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-600 text-center">
            🚢 Hệ Thống Đặt Vé Tàu Cao Tốc
          </h1>
          <p className="text-center text-sm text-gray-600 mt-2">
            HC1 - Nhanh chóng, An toàn, Tiện lợi
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((s, idx) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {s}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">
                    {s === 1 && 'Chọn chuyến'}
                    {s === 2 && 'Người đặt'}
                    {s === 3 && 'Hành khách'}
                    {s === 4 && 'Xác nhận'}
                  </span>
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 form-step">
          {step === 1 && (
            <Step1
              bookingData={bookingData}
              setBookingData={setBookingData}
              routes={routes}
              handleNext={handleNext}
            />
          )}
          {step === 2 && (
            <Step2
              bookingData={bookingData}
              setBookingData={setBookingData}
              handleNext={handleNext}
              setStep={setStep}
            />
          )}
          {step === 3 && (
            <Step3
              bookingData={bookingData}
              setBookingData={setBookingData}
              selectedRoute={selectedRoute}
              calculateTotal={calculateTotal}
              handleNext={handleNext}
              setStep={setStep}
            />
          )}
          {step === 4 && (
            <Step4
              bookingData={bookingData}
              selectedRoute={selectedRoute}
              calculateTotal={calculateTotal}
              settings={settings}
              setStep={setStep}
              handleSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STEP 1: CHỌN CHUYẾN
// =====================================================

function Step1({ bookingData, setBookingData, routes, handleNext }) {
  const selectedRoute = routes.find(r => r.id === bookingData.route_id);
  const canProceed = bookingData.route_id && bookingData.travel_date && bookingData.departure_time;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Bước 1: Chọn Chuyến</h2>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Tuyến Đường <span className="text-red-500">*</span>
        </label>
        <select
          value={bookingData.route_id}
          onChange={(e) => setBookingData({
            ...bookingData,
            route_id: e.target.value,
            departure_time: ''
          })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
        >
          <option value="">-- Chọn tuyến --</option>
          {routes.map(r => (
            <option key={r.id} value={r.id}>{r.route_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Ngày Đi <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={bookingData.travel_date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setBookingData({ ...bookingData, travel_date: e.target.value })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
        />
      </div>

      {selectedRoute && (
        <div>
          <label className="block font-semibold mb-2 text-gray-700">
            Giờ Khởi Hành <span className="text-red-500">*</span>
          </label>
          <select
            value={bookingData.departure_time}
            onChange={(e) => setBookingData({ ...bookingData, departure_time: e.target.value })}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
          >
            <option value="">-- Chọn giờ --</option>
            {selectedRoute.departure_times.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!canProceed}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        Tiếp Theo →
      </button>
    </div>
  );
}

// =====================================================
// STEP 2: THÔNG TIN NGƯỜI ĐẶT
// =====================================================

function Step2({ bookingData, setBookingData, handleNext, setStep }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!bookingData.booker_email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!validateEmail(bookingData.booker_email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!bookingData.booker_name) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!bookingData.booker_phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!validatePhone(bookingData.booker_phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      handleNext();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Bước 2: Thông Tin Người Đặt</h2>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={bookingData.booker_email}
          onChange={(e) => setBookingData({ ...bookingData, booker_email: e.target.value })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
          placeholder="example@email.com"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Họ và Tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={bookingData.booker_name}
          onChange={(e) => setBookingData({ ...bookingData, booker_name: e.target.value })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
          placeholder="Nguyễn Văn A"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Số Điện Thoại <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={bookingData.booker_phone}
          onChange={(e) => setBookingData({ ...bookingData, booker_phone: e.target.value })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
          placeholder="0912345678"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Số Lượng Người <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={bookingData.passenger_count}
          onChange={(e) => setBookingData({ ...bookingData, passenger_count: parseInt(e.target.value) || 1 })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label className="block font-semibold mb-2 text-gray-700">
          Yêu Cầu Đặc Biệt (Tùy chọn)
        </label>
        <textarea
          value={bookingData.special_requests}
          onChange={(e) => setBookingData({ ...bookingData, special_requests: e.target.value })}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 h-24 focus:border-blue-500 transition"
          placeholder="VD: Cần chỗ ngồi gần cửa sổ..."
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
        >
          ← Quay Lại
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Tiếp Theo →
        </button>
      </div>
    </div>
  );
}

// =====================================================
// STEP 3: THÔNG TIN HÀNH KHÁCH
// =====================================================

function Step3({ bookingData, setBookingData, selectedRoute, calculateTotal, handleNext, setStep }) {
  const updatePassenger = (id, field, value) => {
    const newPassengers = bookingData.passengers.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setBookingData({ ...bookingData, passengers: newPassengers });
  };

  const addPassenger = () => {
    setBookingData({
      ...bookingData,
      passengers: [...bookingData.passengers, {
        id: Date.now(),
        name: '',
        birth_year: 2000,
        nationality: 'Vietnam',
        id_number: '',
        seat_type: 'standard'
      }]
    });
  };

  const removePassenger = (id) => {
    if (bookingData.passengers.length > 1) {
      setBookingData({
        ...bookingData,
        passengers: bookingData.passengers.filter(p => p.id !== id)
      });
    }
  };

  const canProceed = bookingData.passengers.every(p => p.name.trim() !== '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Bước 3: Thông Tin Hành Khách</h2>
        <button
          onClick={addPassenger}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          ➕ Thêm
        </button>
      </div>

      <div className="space-y-4">
        {bookingData.passengers.map((passenger, index) => {
          const age = calculateAge(passenger.birth_year);
          const price = calculateTicketPrice(passenger, selectedRoute, bookingData.travel_date);

          return (
            <div key={passenger.id} className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50 passenger-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">Hành Khách #{index + 1}</h3>
                  <span className="text-sm text-blue-600">{getAgeCategory(age)}</span>
                </div>
                {bookingData.passengers.length > 1 && (
                  <button
                    onClick={() => removePassenger(passenger.id)}
                    className="text-red-500 hover:text-red-700 text-2xl"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Họ và tên *"
                  value={passenger.name}
                  onChange={(e) => updatePassenger(passenger.id, 'name', e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 transition"
                />

                <input
                  type="number"
                  placeholder="Năm sinh"
                  min="1920"
                  max="2025"
                  value={passenger.birth_year}
                  onChange={(e) => updatePassenger(passenger.id, 'birth_year', parseInt(e.target.value))}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 transition"
                />

                <select
                  value={passenger.nationality}
                  onChange={(e) => updatePassenger(passenger.id, 'nationality', e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 transition"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Số CMND/Passport"
                  value={passenger.id_number}
                  onChange={(e) => updatePassenger(passenger.id, 'id_number', e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 transition"
                />

                <select
                  value={passenger.seat_type}
                  onChange={(e) => updatePassenger(passenger.id, 'seat_type', e.target.value)}
                  className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 transition md:col-span-2"
                >
                  <option value="standard">Ghế Phổ Thông</option>
                  <option value="vip">Ghế VIP</option>
                </select>
              </div>

              <div className="mt-3 text-right">
                <span className="text-lg font-bold text-blue-600">
                  {price === 0 ? 'Miễn phí' : formatCurrency(price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Tổng thanh toán</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(calculateTotal())}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(2)}
          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
        >
          ← Quay Lại
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Tiếp Theo →
        </button>
      </div>
    </div>
  );
}

// =====================================================
// STEP 4: XÁC NHẬN & THANH TOÁN
// =====================================================

function Step4({ bookingData, selectedRoute, calculateTotal, settings, setStep, handleSubmit, submitting }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Bước 4: Xác Nhận & Thanh Toán</h2>

      {/* Thông tin chuyến */}
      <div className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50">
        <h3 className="font-bold text-lg mb-3 text-blue-600">🚢 Thông Tin Chuyến</h3>
        <p className="mb-1"><strong>Tuyến:</strong> {selectedRoute?.route_name}</p>
        <p className="mb-1"><strong>Ngày:</strong> {new Date(bookingData.travel_date).toLocaleDateString('vi-VN')}</p>
        <p><strong>Giờ:</strong> {bookingData.departure_time}</p>
      </div>

      {/* Người đặt */}
      <div className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50">
        <h3 className="font-bold text-lg mb-3 text-blue-600">👤 Người Đặt Vé</h3>
        <p className="mb-1"><strong>Họ tên:</strong> {bookingData.booker_name}</p>
        <p className="mb-1"><strong>Email:</strong> {bookingData.booker_email}</p>
        <p><strong>SĐT:</strong> {bookingData.booker_phone}</p>
        {bookingData.special_requests && (
          <p className="mt-2"><strong>Yêu cầu:</strong> {bookingData.special_requests}</p>
        )}
      </div>

      {/* Hành khách */}
      <div className="border-2 border-gray-200 p-4 rounded-lg bg-gray-50">
        <h3 className="font-bold text-lg mb-3 text-blue-600">
          👥 Danh Sách Hành Khách ({bookingData.passengers.length})
        </h3>
        {bookingData.passengers.map((p, i) => {
          const price = calculateTicketPrice(p, selectedRoute, bookingData.travel_date);
          return (
            <div key={i} className="py-2 border-b last:border-b-0 flex justify-between">
              <span>{i + 1}. {p.name} - {calculateAge(p.birth_year)} tuổi - {p.seat_type === 'vip' ? 'VIP' : 'Phổ thông'}</span>
              <span className="font-semibold">{formatCurrency(price)}</span>
            </div>
          );
        })}
      </div>

      {/* Tổng tiền */}
      <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg">
        <div className="text-center">
          <p className="text-gray-700 mb-2 text-lg">💰 Tổng Thanh Toán</p>
          <p className="text-4xl font-bold text-green-600">{formatCurrency(calculateTotal())}</p>
        </div>
      </div>

      {/* Thông tin chuyển khoản */}
      <div className="bg-yellow-50 border-2 border-yellow-500 p-6 rounded-lg">
        <h3 className="font-bold text-lg mb-4 text-yellow-700">💳 Thông Tin Chuyển Khoản</h3>
        <div className="space-y-2">
          <p><strong>Ngân hàng:</strong> {settings.bank_name || 'N/A'}</p>
          <p><strong>Chủ tài khoản:</strong> {settings.bank_account_name || 'N/A'}</p>
          <p><strong>Số tài khoản:</strong> <span className="text-xl font-mono font-bold">{settings.bank_account_number || 'N/A'}</span></p>
          <p><strong>Số tiền:</strong> <span className="text-red-600 font-bold text-xl">{formatCurrency(calculateTotal())}</span></p>
          <p><strong>Nội dung CK:</strong> <span className="text-blue-600 font-bold">{bookingData.booker_name} {bookingData.booker_phone}</span></p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => setStep(3)}
          disabled={submitting}
          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition"
        >
          ← Quay Lại
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition text-lg"
        >
          {submitting ? '⏳ Đang xử lý...' : '✅ Xác Nhận Thanh Toán'}
        </button>
      </div>
    </div>
  );
}

// =====================================================
// RENDER APP
// =====================================================

ReactDOM.render(<FerryBookingApp />, document.getElementById('root'));
