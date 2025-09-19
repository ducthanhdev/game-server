# ⚡ Quick Start - Chạy Dự Án MVC

## 🎯 **Cách Chạy Nhanh Nhất**

### **Windows:**
```bash
# Double-click file run.bat
# Hoặc chạy trong Command Prompt:
run.bat
```

### **macOS/Linux:**
```bash
# Chạy script:
./run.sh
# Hoặc:
bash run.sh
```

## 🔧 **Chạy Thủ Công (3 Terminal)**

### **Terminal 1: MongoDB**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### **Terminal 2: Backend**
```bash
cd backend
npm install
npm run start:dev
```

### **Terminal 3: Frontend**
```bash
cd frontend
npm install
npm start
```

## 🌐 **Truy Cập**

Mở trình duyệt: **http://localhost:8080**

## ✅ **Kiểm Tra Hoạt Động**

1. **Backend**: http://localhost:3000 (API)
2. **Frontend**: http://localhost:8080 (Game)
3. **MongoDB**: mongodb://localhost:27017 (Database)

## 🎮 **Test Game**

1. Đăng ký tài khoản mới
2. Đăng nhập
3. Chọn Line 98 hoặc Cờ Caro
4. Chơi game!

**Chúc bạn chạy thành công!** 🚀
