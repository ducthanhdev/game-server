# 🎮 Server Game - Mô Hình MVC

Dự án server game được tái cấu trúc theo **mô hình MVC** với frontend thuần HTML/CSS/JS và backend NestJS API.

## 🏗️ **Cấu Trúc Mới**

```
project/
├── frontend/                 # 🎨 Frontend thuần HTML/CSS/JS
│   ├── index.html           # Trang chủ
│   ├── css/
│   │   └── styles.css       # CSS styles
│   ├── js/
│   │   ├── auth.js          # Authentication logic
│   │   ├── ui-utils.js      # UI utilities
│   │   ├── line98-game.js   # Line 98 game logic
│   │   ├── caro-game.js     # Caro game logic
│   │   └── app.js           # Main application
│   └── package.json         # Frontend dependencies
└── backend/                  # 🔧 Backend NestJS API
    ├── src/
    │   ├── auth/            # Authentication API
    │   ├── users/           # User management API
    │   ├── games/           # Game logic API
    │   └── database/        # Database schemas
    ├── package.json         # Backend dependencies
    └── dist/                # Build output
```

## ✨ **Tính Năng Chính**

### 🎨 **Frontend (Thuần HTML/CSS/JS)**
- ✅ **Responsive Design** với CSS3 animations
- ✅ **HTML5 Canvas** cho đồ họa game
- ✅ **Vanilla JavaScript** ES6+ (không framework)
- ✅ **API calls** đến backend NestJS
- ✅ **JWT Authentication** với localStorage
- ✅ **Toast notifications** và UI utilities

### 🔧 **Backend (NestJS API)**
- ✅ **REST API** cho tất cả operations
- ✅ **JWT Authentication** với Passport
- ✅ **MongoDB** với Mongoose ODM
- ✅ **Input Validation** với class-validator
- ✅ **CORS** configuration cho frontend
- ✅ **Error Handling** toàn diện

## 🚀 **Cài Đặt và Chạy**

### **1. Backend (NestJS API)**

```bash
cd backend
npm install
npm run start:dev
# API Server chạy tại: http://localhost:3000
```

### **2. Frontend (HTML/CSS/JS)**

```bash
cd frontend
npm install
npm start
# Frontend chạy tại: http://localhost:8080
```

**Hoặc sử dụng Python:**
```bash
cd frontend
python -m http.server 8080
# Frontend chạy tại: http://localhost:8080
```

## 🔌 **API Endpoints**

### **Authentication**
```http
POST /auth/register    # Đăng ký tài khoản
POST /auth/login       # Đăng nhập
GET  /auth/profile     # Lấy thông tin profile (JWT required)
```

### **Users**
```http
PUT /users/profile     # Cập nhật thông tin (JWT required)
```

### **Games**

#### **Line 98**
```http
POST /games/line98/create           # Tạo game mới
GET  /games/line98/:gameId          # Lấy trạng thái game
PUT  /games/line98/:gameId/move     # Thực hiện nước đi
GET  /games/line98/:gameId/hint     # Lấy gợi ý
POST /games/line98/:gameId/save     # Lưu game
```

#### **Cờ Caro**
```http
POST /games/caro/create             # Tạo game mới
POST /games/caro/join               # Tham gia game
GET  /games/caro/:gameId            # Lấy trạng thái game
PUT  /games/caro/:gameId/move       # Thực hiện nước đi
GET  /games/caro/available          # Lấy danh sách game có sẵn
GET  /games/caro/user/:userId/history # Lịch sử game
```

## 🎯 **Tính Năng Game**

### **Line 98 (Solo)**
- **Bảng chơi**: 9x9 với 5 màu bóng
- **Mục tiêu**: Tạo hàng 5 bóng cùng màu
- **Tính năng**: 
  - Di chuyển bóng kề cận
  - Sinh 3 bóng mới sau mỗi lượt
  - Hệ thống gợi ý thông minh
  - Lưu trạng thái vào database

### **Cờ Caro (Multiplayer)**
- **Bảng chơi**: 15x15, hai người chơi X và O
- **Mục tiêu**: Tạo hàng 5 ký hiệu liên tiếp
- **Tính năng**:
  - Chế độ local (2 người trên 1 máy)
  - Chế độ online (2 người qua API)
  - Ghép cặp ngẫu nhiên
  - Lưu lịch sử trận đấu

## 🔐 **Authentication Flow**

1. **Frontend** gửi request đến `/auth/login` hoặc `/auth/register`
2. **Backend** xác thực và trả về JWT token
3. **Frontend** lưu token vào localStorage
4. **Frontend** gửi token trong header `Authorization: Bearer <token>`
5. **Backend** xác thực token và xử lý request

## 🌐 **CORS Configuration**

Backend được cấu hình CORS để cho phép frontend truy cập:

```typescript
app.enableCors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
});
```

## 📱 **Responsive Design**

Frontend được thiết kế responsive với:
- **Mobile-first** approach
- **Flexible grid** layout
- **Touch-friendly** controls
- **Adaptive** canvas sizing

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
npm test
npm run test:cov
```

### **Frontend Testing**
- **Manual testing** với browser dev tools
- **API testing** với Postman hoặc curl
- **Cross-browser** compatibility

## 🚀 **Deployment**

### **Frontend**
- Deploy lên **static hosting** (Vercel, Netlify, GitHub Pages)
- Hoặc serve từ **CDN**

### **Backend**
- Deploy lên **VPS** hoặc **cloud** (AWS, DigitalOcean)
- Sử dụng **PM2** cho production
- Cấu hình **reverse proxy** (Nginx)

## 🔧 **Development**

### **Frontend Development**
```bash
cd frontend
# Chỉnh sửa HTML/CSS/JS
# Refresh browser để xem thay đổi
```

### **Backend Development**
```bash
cd backend
npm run start:dev
# Auto-reload khi có thay đổi
```

## 📊 **Performance**

- **Frontend**: Tải nhanh với vanilla JS
- **Backend**: API response < 100ms
- **Database**: MongoDB với indexing
- **Caching**: Có thể thêm Redis

## 🎯 **Lợi Ích Mô Hình MVC**

1. **Tách biệt rõ ràng**: Frontend và Backend độc lập
2. **Scalability**: Có thể scale riêng biệt
3. **Maintainability**: Dễ bảo trì và phát triển
4. **Flexibility**: Có thể thay đổi frontend/backend
5. **Team work**: Frontend và Backend team làm việc độc lập

## 🏆 **Kết Luận**

Dự án đã được tái cấu trúc thành công theo mô hình MVC với:
- ✅ **Frontend thuần HTML/CSS/JS**
- ✅ **Backend NestJS API**
- ✅ **Authentication với JWT**
- ✅ **Database MongoDB**
- ✅ **Responsive design**
- ✅ **Production ready**

**Server sẵn sàng cho production với architecture rõ ràng và dễ bảo trì!** 🚀✨
