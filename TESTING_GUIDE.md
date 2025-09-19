# 🧪 Hướng Dẫn Test Game Online

## 📋 **Các Cách Test Khác Nhau**

### **1. Test Trên Cùng 1 Máy (Hiện Tại)**
- Mở 2 tab browser khác nhau
- Đăng nhập với 2 tài khoản khác nhau
- Chơi game online

### **2. Test Trên 2 Máy Khác Nhau (LAN)**

#### **Bước 1: Lấy IP của máy chạy server**
```bash
# Windows
ipconfig

# Tìm IPv4 Address (ví dụ: 192.168.1.100)
```

#### **Bước 2: Cập nhật config cho máy thứ 2**
1. Mở file `frontend/index.html`
2. Comment dòng: `<script src="js/config.js"></script>`
3. Uncomment dòng: `<script src="js/config-lan.js"></script>`
4. Sửa IP trong `frontend/js/config-lan.js` thành IP của máy server

#### **Bước 3: Chạy server**
```bash
cd backend
npm run start:dev
```

#### **Bước 4: Chạy frontend**
```bash
# Máy 1 (Server)
cd frontend
python -m http.server 8080

# Máy 2 (Client)
cd frontend
python -m http.server 8081
```

### **3. Test Qua Internet (Ngrok)**

#### **Bước 1: Cài đặt Ngrok**
```bash
# Download từ https://ngrok.com/
# Hoặc dùng npm
npm install -g ngrok
```

#### **Bước 2: Tạo tunnel**
```bash
# Terminal 1: Chạy server
cd backend
npm run start:dev

# Terminal 2: Tạo tunnel cho backend
ngrok http 3000

# Terminal 3: Tạo tunnel cho frontend
ngrok http 8080
```

#### **Bước 3: Cập nhật config**
- Lấy URL từ ngrok (ví dụ: https://abc123.ngrok.io)
- Cập nhật `config-lan.js` với URL ngrok

### **4. Test Với Docker (Nâng Cao)**

#### **Tạo Dockerfile cho frontend:**
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

#### **Chạy với Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
  
  frontend:
    build: ./frontend
    ports:
      - "8080:80"
```

## 🔧 **Troubleshooting**

### **Lỗi CORS:**
- Kiểm tra CORS config trong `backend/src/main.ts`
- Đảm bảo IP được thêm vào `origin` array

### **Lỗi WebSocket:**
- Kiểm tra firewall
- Đảm bảo port 3000 được mở

### **Lỗi Connection Refused:**
- Kiểm tra IP address
- Đảm bảo server đang chạy
- Kiểm tra network connectivity

## 📱 **Test Mobile**

### **Cách 1: Dùng IP của máy tính**
- Kết nối điện thoại cùng WiFi
- Truy cập `http://IP_MÁY_TÍNH:8080`

### **Cách 2: Dùng Ngrok**
- Tạo tunnel với ngrok
- Truy cập URL ngrok từ điện thoại

## 🎯 **Kịch Bản Test**

### **Test Cơ Bản:**
1. Tạo 2 tài khoản
2. Đăng nhập trên 2 máy/tab
3. Chọn "Chơi online" trên cả 2
4. Kiểm tra matchmaking
5. Chơi game và kiểm tra real-time sync

### **Test Nâng Cao:**
1. Test với mạng chậm
2. Test disconnect/reconnect
3. Test với nhiều phòng game
4. Test trên mobile
5. Test với firewall

## 🚀 **Quick Start cho LAN Testing**

```bash
# Máy 1 (Server)
cd backend && npm run start:dev
cd frontend && python -m http.server 8080

# Máy 2 (Client) - Sửa config-lan.js trước
cd frontend && python -m http.server 8081
```

**Lưu ý:** Thay `192.168.1.100` bằng IP thực tế của máy server!
