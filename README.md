# 🎮 Server Game - Line 98 & Cờ Caro

Dự án game server sử dụng NestJS với 2 game: Line 98 và Cờ Caro X O.

## 🚀 Quick Start

### Cách 1: Script tự động
```bash
# Chạy script khởi động
start-servers.bat
```

### Cách 2: Chạy thủ công
```bash
# Terminal 1: Backend
cd backend
npm install
npm run start:dev

# Terminal 2: Frontend
cd frontend
python -m http.server 8080
```

## 🌐 Truy cập

- **Máy tính:** http://localhost:8080
- **Điện thoại:** http://192.168.0.106:8080 (thay IP của bạn)

## 🎯 Tính năng

### Line 98
- ✅ Game logic hoàn chỉnh
- ✅ AI hint thông minh (3 levels)
- ✅ Auto-save game state
- ✅ Animations đẹp mắt
- ✅ Mobile responsive

### Cờ Caro X O
- ✅ Chế độ local (2 người)
- ✅ Chế độ AI (3 độ khó)
- ✅ Chế độ online (real-time)
- ✅ Matchmaking tự động
- ✅ Mobile responsive

## 🔧 Tech Stack

- **Backend:** NestJS, MongoDB, Socket.IO, JWT
- **Frontend:** HTML5, CSS3, JavaScript, Canvas
- **Database:** MongoDB với Mongoose
- **Real-time:** WebSocket (Socket.IO)

## 📱 Testing

- **1 máy:** 2 tab browser (thường + ẩn danh)
- **2 máy:** Máy tính + điện thoại
- **Chi tiết:** Xem `TESTING_GUIDE.md`

## 📁 Cấu trúc

```
server-game/
├── backend/          # NestJS API server
├── frontend/         # HTML/CSS/JS client
├── start-servers.bat # Script khởi động
└── README.md         # File này
```

## 🎮 Cách chơi

1. **Đăng ký/Đăng nhập** tài khoản
2. **Chọn game** (Line 98 hoặc Cờ Caro)
3. **Chọn chế độ** (Local/AI/Online)
4. **Chơi game** và tận hưởng!

## 📖 Documentation

- `HOW_TO_RUN.md` - Hướng dẫn chi tiết
- `TESTING_GUIDE.md` - Hướng dẫn test
- `TEST_PHONE.md` - Test trên điện thoại
- `TEST_2_MACHINES.md` - Test 2 máy

## 🐛 Troubleshooting

- **Lỗi kết nối:** Kiểm tra IP và firewall
- **Lỗi CORS:** Backend đã config sẵn
- **Lỗi WebSocket:** Kiểm tra port 3000

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa.
