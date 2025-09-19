# 🧹 Dọn Dẹp Cấu Trúc Dự Án MVC

## 🔍 **Vấn Đề Hiện Tại:**

Dự án hiện tại có **2 cấu trúc song song**:

1. **`src/`** (root) - Code cũ với WebSocket, Gateway
2. **`backend/src/`** - Code mới theo mô hình MVC với API

## 🎯 **Cấu Trúc Mong Muốn:**

```
project/
├── frontend/                 # 🎨 Frontend thuần HTML/CSS/JS
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── package.json
├── backend/                  # 🔧 Backend NestJS API
│   ├── src/
│   ├── package.json
│   └── dist/
└── docs/                     # 📚 Documentation
    ├── README_MVC.md
    ├── HOW_TO_RUN.md
    └── QUICK_START.md
```

## 🗑️ **Files/Thư Mục Cần Xóa:**

### **Thư mục cũ (không cần thiết):**
- `src/` - Code cũ với WebSocket
- `public/` - Frontend cũ
- `dist/` - Build cũ
- `test/` - Tests cũ
- `coverage/` - Coverage cũ

### **Files cũ (không cần thiết):**
- `package.json` (root) - Package.json cũ
- `package-lock.json` - Lock file cũ
- `nest-cli.json` - NestJS config cũ
- `tsconfig.json` - TypeScript config cũ
- `jest.config.js` - Jest config cũ

## ✅ **Files/Thư Mục Giữ Lại:**

### **Backend:**
- `backend/` - Backend mới
- `backend/src/` - Source code mới
- `backend/package.json` - Dependencies mới

### **Frontend:**
- `frontend/` - Frontend mới
- `frontend/index.html` - Trang chủ mới
- `frontend/css/` - Styles mới
- `frontend/js/` - JavaScript mới
- `frontend/package.json` - Dependencies mới

### **Documentation:**
- `README_MVC.md` - Hướng dẫn MVC
- `HOW_TO_RUN.md` - Hướng dẫn chạy
- `QUICK_START.md` - Hướng dẫn nhanh
- `run.bat` - Script Windows
- `run.sh` - Script Linux/macOS

## 🚀 **Sau Khi Dọn Dẹp:**

1. **Cấu trúc rõ ràng** - Chỉ có frontend và backend
2. **Không nhầm lẫn** - Không có code cũ
3. **Dễ bảo trì** - Mô hình MVC thuần túy
4. **Dễ deploy** - Tách biệt hoàn toàn

## ⚠️ **Lưu Ý:**

- **Backup** code cũ trước khi xóa
- **Kiểm tra** dependencies trước khi xóa
- **Test** lại sau khi dọn dẹp
