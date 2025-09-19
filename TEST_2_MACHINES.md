# 🎮 HƯỚNG DẪN TEST GAME ONLINE 2 MÁY

## 📋 **THÔNG TIN MÁY SERVER**
- **IP Address:** `192.168.0.106`
- **Backend Port:** `3000`
- **Frontend Port:** `8080`

## 🖥️ **MÁY 1 (SERVER) - Chạy Backend + Frontend**

### **Bước 1: Chạy Backend**
```bash
cd backend
npm run start:dev
```
**Kết quả:** Server chạy tại `http://192.168.0.106:3000`

### **Bước 2: Chạy Frontend**
```bash
cd frontend
python -m http.server 8080
```
**Kết quả:** Frontend chạy tại `http://192.168.0.106:8080`

### **Bước 3: Test trên máy 1**
1. Mở browser: `http://localhost:8080`
2. Đăng ký tài khoản: `player1` / `password123`
3. Đăng nhập và chọn "Chơi online"
4. Chờ người chơi thứ 2

---

## 💻 **MÁY 2 (CLIENT) - Chỉ chạy Frontend**

### **Bước 1: Cập nhật config**
1. Mở file `frontend/index.html`
2. Comment dòng: `<!-- <script src="js/config.js"></script> -->`
3. Uncomment dòng: `<script src="js/config-lan.js"></script>`

### **Bước 2: Chạy Frontend**
```bash
cd frontend
python -m http.server 8081
```
**Kết quả:** Frontend chạy tại `http://localhost:8081`

### **Bước 3: Test trên máy 2**
1. Mở browser: `http://localhost:8081`
2. Đăng ký tài khoản: `player2` / `password123`
3. Đăng nhập và chọn "Chơi online"
4. Sẽ tự động match với player1

---

## 🎯 **KỊCH BẢN TEST**

### **Test 1: Đăng ký và đăng nhập**
- [ ] Máy 1: Đăng ký `player1`
- [ ] Máy 2: Đăng ký `player2`
- [ ] Cả 2 máy đăng nhập thành công

### **Test 2: Matchmaking**
- [ ] Máy 1: Chọn "Chơi online" → Hiển thị "Đang tìm đối thủ..."
- [ ] Máy 2: Chọn "Chơi online" → Tự động match với player1
- [ ] Cả 2 máy thấy game board và biết lượt của mình

### **Test 3: Chơi game**
- [ ] Player X (máy 1) đánh nước đầu
- [ ] Player O (máy 2) thấy nước đi của X
- [ ] Player O đánh nước tiếp theo
- [ ] Player X thấy nước đi của O
- [ ] Tiếp tục cho đến khi có người thắng

### **Test 4: Kết thúc game**
- [ ] Khi có người thắng, cả 2 máy thấy kết quả
- [ ] Có thể chơi game mới (tạo phòng mới)

---

## 🔧 **TROUBLESHOOTING**

### **Lỗi "Connection Refused"**
- Kiểm tra IP address có đúng không
- Kiểm tra server có đang chạy không
- Kiểm tra firewall

### **Lỗi CORS**
- Backend đã config CORS cho tất cả origin
- Nếu vẫn lỗi, kiểm tra `backend/src/main.ts`

### **Lỗi WebSocket**
- Kiểm tra port 3000 có bị block không
- Kiểm tra network connectivity

### **Không match được**
- Kiểm tra cả 2 máy đều chọn "Chơi online"
- Kiểm tra console log để debug

---

## 📱 **TEST TRÊN MOBILE**

### **Cách 1: Dùng IP trực tiếp**
- Kết nối điện thoại cùng WiFi
- Truy cập: `http://192.168.0.106:8080`

### **Cách 2: Dùng ngrok (nếu cần)**
```bash
# Cài đặt ngrok
npm install -g ngrok

# Tạo tunnel
ngrok http 3000
ngrok http 8080
```

---

## 🚀 **QUICK START**

### **Máy 1 (Server):**
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2  
cd frontend && python -m http.server 8080
```

### **Máy 2 (Client):**
```bash
# Sửa frontend/index.html trước
cd frontend && python -m http.server 8081
```

**Lưu ý:** Đảm bảo cả 2 máy cùng mạng WiFi!
