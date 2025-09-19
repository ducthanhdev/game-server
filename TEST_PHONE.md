# 📱 HƯỚNG DẪN TEST GAME TRÊN ĐIỆN THOẠI

## 🖥️ **MÁY TÍNH (Máy 1) - Chạy Server**

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

### **Bước 3: Test trên máy tính**
1. Mở browser: `http://localhost:8080`
2. Đăng ký tài khoản: `player1` / `password123`
3. Đăng nhập và chọn "Chơi online"
4. Chờ điện thoại kết nối

---

## 📱 **ĐIỆN THOẠI (Máy 2) - Kết nối trực tiếp**

### **Bước 1: Kết nối cùng WiFi**
- Đảm bảo điện thoại và máy tính cùng mạng WiFi
- Kiểm tra IP máy tính: `192.168.0.106`

### **Bước 2: Truy cập game từ điện thoại**
1. Mở browser trên điện thoại (Chrome, Safari, Firefox)
2. Truy cập: `http://192.168.0.106:8080`
3. **Lưu ý:** Có thể cần chờ vài giây để load

### **Bước 3: Đăng ký tài khoản mới**
1. Chọn "Đăng ký"
2. Tạo tài khoản: `player2` / `password123`
3. Đăng nhập

### **Bước 4: Chơi game online**
1. Chọn "Chơi online"
2. Sẽ tự động match với player1 trên máy tính
3. Bắt đầu chơi!

---

## 🎯 **KỊCH BẢN TEST**

### **Test 1: Kết nối**
- [ ] Máy tính: Server chạy thành công
- [ ] Điện thoại: Truy cập được `http://192.168.0.106:8080`
- [ ] Điện thoại: Đăng ký tài khoản thành công

### **Test 2: Matchmaking**
- [ ] Máy tính: Chọn "Chơi online" → "Đang tìm đối thủ..."
- [ ] Điện thoại: Chọn "Chơi online" → Tự động match
- [ ] Cả 2 thiết bị thấy game board

### **Test 3: Chơi game**
- [ ] Player X (máy tính) đánh nước đầu
- [ ] Player O (điện thoại) thấy nước đi của X
- [ ] Player O đánh nước tiếp theo
- [ ] Player X thấy nước đi của O
- [ ] Tiếp tục cho đến khi có người thắng

### **Test 4: Responsive Design**
- [ ] Game hiển thị đẹp trên điện thoại
- [ ] Có thể chạm để đánh cờ
- [ ] Không bị lỗi khi xoay màn hình

---

## 🔧 **TROUBLESHOOTING**

### **Lỗi "Không thể truy cập"**
- Kiểm tra IP address có đúng không
- Kiểm tra máy tính và điện thoại cùng WiFi
- Thử tắt firewall tạm thời

### **Lỗi "Trang không load"**
- Chờ vài giây để load
- Thử refresh trang
- Kiểm tra console log trên điện thoại

### **Lỗi "Không match được"**
- Kiểm tra cả 2 thiết bị đều chọn "Chơi online"
- Kiểm tra server có đang chạy không
- Thử tạo tài khoản mới

### **Game không responsive**
- Xoay điện thoại để xem landscape
- Thử zoom in/out
- Kiểm tra CSS responsive

---

## 📱 **TIPS CHO ĐIỆN THOẠI**

### **Tối ưu trải nghiệm:**
1. **Xoay ngang điện thoại** để có nhiều không gian hơn
2. **Zoom out** nếu game quá to
3. **Chạm nhẹ** để đánh cờ, không cần nhấn mạnh
4. **Chờ vài giây** sau mỗi nước đi để sync

### **Nếu game quá nhỏ:**
- Xoay điện thoại ngang
- Zoom out browser
- Thử browser khác (Chrome, Safari)

### **Nếu game quá to:**
- Zoom in browser
- Thử landscape mode
- Kiểm tra responsive CSS

---

## 🚀 **QUICK START**

### **Máy tính:**
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && python -m http.server 8080
```

### **Điện thoại:**
1. Kết nối cùng WiFi
2. Truy cập: `http://192.168.0.106:8080`
3. Đăng ký và chơi!

**Lưu ý:** Đảm bảo cả 2 thiết bị cùng mạng WiFi!
