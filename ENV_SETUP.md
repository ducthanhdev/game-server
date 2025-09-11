# 🔧 Environment Variables Setup

Hướng dẫn cấu hình environment variables cho dự án **Server Game - Line 98 & Cờ Caro X O**.

> **⚠️ QUAN TRỌNG:** File `.env` không được commit lên Git vì lý do bảo mật. Bạn cần tự tạo file này theo hướng dẫn bên dưới.

## 🎯 **Quick Start cho Nhà Tuyển Dụng**

### **TL;DR - Chạy nhanh trong 3 bước:**

1. **Tạo file `.env`:**
   ```bash
   touch .env
   ```

2. **Copy nội dung này vào `.env`:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/game-server
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=*
   ```

3. **Chạy ứng dụng:**
   ```bash
   npm install
   npm run start:dev
   ```

**Xong! Server sẽ chạy tại http://localhost:3000** 🚀

## 📋 Tạo File .env

### 1. **Tạo file `.env` trong root directory**
```bash
# Tạo file .env
touch .env
# Hoặc trên Windows
echo. > .env
```

### 2. **Copy nội dung này vào file `.env`**
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/game-server

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*
```

## 🔐 Security Best Practices

### ✅ **Development Environment**
```bash
# .env (development)
MONGODB_URI=mongodb://localhost:27017/game-server
JWT_SECRET=dev-secret-key-not-for-production
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### ✅ **Production Environment**
```bash
# .env.production
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=super-secure-random-string-256-bits-minimum
JWT_EXPIRES_IN=1h
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

## 🛠️ Configuration Files

### 📁 **Database Config** (`src/config/database.config.ts`)
```typescript
export const databaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/game-server',
};
```

### 🔑 **JWT Config** (`src/config/jwt.config.ts`)
```typescript
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};
```

## 🔒 JWT Secret Generation

### 🎲 **Generate Secure JWT Secret**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Online generator
# https://generate-secret.vercel.app/64
```

### 📝 **Example Secure JWT Secret**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

## 🌍 Environment-Specific Configs

### 🏠 **Development (.env.development)**
```bash
MONGODB_URI=mongodb://localhost:27017/game-server-dev
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 🧪 **Testing (.env.test)**
```bash
MONGODB_URI=mongodb://localhost:27017/game-server-test
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
PORT=3001
NODE_ENV=test
CORS_ORIGIN=http://localhost:3001
```

### 🚀 **Production (.env.production)**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/game-server
JWT_SECRET=production-super-secure-secret-256-bits
JWT_EXPIRES_IN=1h
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

## 📦 Package.json Scripts

### 🔧 **Add Environment Scripts**
```json
{
  "scripts": {
    "start": "node dist/main",
    "start:dev": "cross-env NODE_ENV=development nodemon",
    "start:prod": "cross-env NODE_ENV=production node dist/main",
    "start:test": "cross-env NODE_ENV=test node dist/main",
    "build": "nest build",
    "test": "cross-env NODE_ENV=test jest",
    "test:watch": "cross-env NODE_ENV=test jest --watch"
  }
}
```

## 🔧 Cross-Environment Support

### 📦 **Install cross-env**
```bash
npm install --save-dev cross-env
```

### 🐧 **Linux/macOS/Windows Support**
```bash
# Works on all platforms
cross-env NODE_ENV=production npm start
cross-env NODE_ENV=development npm run start:dev
```

## 🛡️ Security Checklist

### ✅ **Environment Security**
- [ ] `.env` file is in `.gitignore`
- [ ] JWT secret is at least 256 bits (64 characters)
- [ ] Database credentials are secure
- [ ] CORS origins are restricted in production
- [ ] Environment variables are validated

### ✅ **Production Security**
- [ ] Use environment-specific configs
- [ ] Rotate JWT secrets regularly
- [ ] Use HTTPS in production
- [ ] Validate all environment variables
- [ ] Use secure database connections

## 🚨 Common Issues

### ❌ **Environment Variables Not Loading**
```bash
# Check if .env file exists
ls -la .env

# Check file permissions
chmod 600 .env

# Verify content
cat .env
```

### ❌ **JWT Secret Not Working**
```bash
# Check if JWT_SECRET is set
echo $JWT_SECRET

# Verify in application
console.log(process.env.JWT_SECRET);
```

### ❌ **Database Connection Issues**
```bash
# Check MongoDB URI
echo $MONGODB_URI

# Test connection
mongosh "$MONGODB_URI"
```

## 📋 Validation

### ✅ **Environment Variables Validation**
```typescript
// src/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  CORS_ORIGIN: Joi.string().default('*'),
});
```

## 🎯 **Kết Luận**

### ✅ **Đã Hoàn Thành:**
1. ✅ **Configuration files** đã được cập nhật để sử dụng environment variables
2. ✅ **Security** được cải thiện với JWT secret có thể config
3. ✅ **Flexibility** cho các môi trường khác nhau (dev/test/prod)
4. ✅ **Best practices** được áp dụng

### 🚀 **Hướng Dẫn Cho Nhà Tuyển Dụng:**

#### **Bước 1: Tạo file `.env`**
```bash
# Tạo file .env trong root directory
touch .env
# Hoặc trên Windows
echo. > .env
```

#### **Bước 2: Copy nội dung sau vào file `.env`:**
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/game-server

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*
```

#### **Bước 3: Chạy ứng dụng**
```bash
# Install dependencies
npm install

# Start MongoDB (nếu chưa chạy)
mongod

# Start development server
npm run start:dev

# Server sẽ chạy tại: http://localhost:3000
```

#### **Bước 4: Kiểm tra**
- ✅ Server khởi động thành công
- ✅ Kết nối MongoDB thành công
- ✅ JWT authentication hoạt động
- ✅ WebSocket connections hoạt động

**Environment variables đã được cấu hình đúng cách!** 🔧✨
