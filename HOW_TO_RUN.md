# 🚀 Hướng Dẫn Chạy Dự Án MVC

## 📋 **Yêu Cầu Hệ Thống**

- **Node.js** >= 16.0.0
- **MongoDB** >= 4.4.0
- **Python** (để chạy frontend) hoặc **http-server**

## 🎯 **Cách Chạy Dự Án**

### **Bước 1: Khởi Động MongoDB**

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### **Bước 2: Chạy Backend (API Server)**

```bash
# Mở terminal thứ nhất
cd backend
npm install
npm run start:dev
```

**Kết quả:**
```
API Server is running on http://localhost:3000
```

### **Bước 3: Chạy Frontend (Static Files)**

```bash
# Mở terminal thứ hai
cd frontend
npm install
npm start
```

**Kết quả:**
```
Starting up http-server, serving ./
Available on:
  http://localhost:8080
```

### **Bước 4: Truy Cập Ứng Dụng**

Mở trình duyệt: **http://localhost:8080**

## 🔧 **Script Tự Động**

### **Windows (run.bat)**

```batch
@echo off
echo Starting Server Game MVC...

echo Starting MongoDB...
net start MongoDB

echo Starting Backend API...
start cmd /k "cd backend && npm install && npm run start:dev"

echo Waiting for backend to start...
timeout /t 5

echo Starting Frontend...
start cmd /k "cd frontend && npm install && npm start"

echo Opening browser...
timeout /t 3
start http://localhost:8080

echo All services started!
pause
```

### **macOS/Linux (run.sh)**

```bash
#!/bin/bash
echo "Starting Server Game MVC..."

echo "Starting MongoDB..."
brew services start mongodb-community

echo "Starting Backend API..."
cd backend
npm install
npm run start:dev &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 5

echo "Starting Frontend..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!

echo "Opening browser..."
sleep 3
open http://localhost:8080

echo "All services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
```

## 🐳 **Docker (Tùy Chọn)**

### **docker-compose.yml**

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: game-server

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/game-server

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### **Chạy với Docker**

```bash
docker-compose up --build
```

## 🔍 **Kiểm Tra Kết Nối**

### **Backend API**
```bash
curl http://localhost:3000/auth/profile
# Kết quả: {"message": "Unauthorized"} (bình thường)
```

### **Frontend**
```bash
curl http://localhost:8080
# Kết quả: HTML content
```

## 🐛 **Troubleshooting**

### **Lỗi MongoDB**
```bash
# Kiểm tra MongoDB service
net start MongoDB          # Windows
brew services list | grep mongo  # macOS
sudo systemctl status mongod     # Linux
```

### **Lỗi Port 3000 (Backend)**
```bash
# Kiểm tra port
netstat -an | findstr :3000
# Kill process nếu cần
taskkill /PID <PID> /F
```

### **Lỗi Port 8080 (Frontend)**
```bash
# Kiểm tra port
netstat -an | findstr :8080
# Kill process nếu cần
taskkill /PID <PID> /F
```

### **Lỗi CORS**
- Kiểm tra backend đang chạy trên port 3000
- Kiểm tra frontend đang chạy trên port 8080
- Kiểm tra CORS configuration trong `backend/src/main.ts`

## 📱 **Test Ứng Dụng**

1. **Mở http://localhost:8080**
2. **Đăng ký tài khoản mới**
3. **Đăng nhập**
4. **Chọn game Line 98 hoặc Cờ Caro**
5. **Chơi game và test các tính năng**

## 🎯 **Cấu Trúc Ports**

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

## ⚡ **Quick Start (Tất Cả Trong Một)**

```bash
# Terminal 1: MongoDB
mongod

# Terminal 2: Backend
cd backend && npm install && npm run start:dev

# Terminal 3: Frontend
cd frontend && npm install && npm start

# Mở browser: http://localhost:8080
```

## 🏆 **Kết Quả Mong Đợi**

Khi chạy thành công, bạn sẽ thấy:

1. **Backend**: "API Server is running on http://localhost:3000"
2. **Frontend**: "Available on: http://localhost:8080"
3. **Browser**: Giao diện game đẹp mắt với 2 trò chơi
4. **Authentication**: Đăng ký/đăng nhập hoạt động
5. **Games**: Line 98 và Cờ Caro chạy mượt mà

**Chúc bạn chạy thành công!** 🚀✨
