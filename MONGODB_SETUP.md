# 🗄️ Hướng Dẫn Cài Đặt MongoDB

Hướng dẫn chi tiết cài đặt và cấu hình MongoDB cho dự án **Server Game - Line 98 & Cờ Caro X O**.

## 📋 Yêu Cầu Hệ Thống

- **MongoDB**: >= 4.4.0 (Khuyến nghị: MongoDB 6.0+)
- **Node.js**: >= 16.0.0
- **RAM**: Tối thiểu 2GB (Khuyến nghị: 4GB+)
- **Storage**: Tối thiểu 1GB trống

## 🖥️ Cài Đặt MongoDB

### 🪟 Windows

#### Phương pháp 1: MongoDB Installer (Khuyến nghị)
1. **Tải MongoDB Community Server**:
   - Truy cập: https://www.mongodb.com/try/download/community
   - Chọn **Windows** → **MSI** → **Download**

2. **Cài đặt**:
   ```
   - Chạy file .msi vừa tải
   - Chọn "Complete" setup
   - Tick "Install MongoDB as a Service"
   - Tick "Install MongoDB Compass" (GUI tool)
   ```

3. **Khởi động MongoDB Service**:
   ```cmd
   # Mở Command Prompt as Administrator
   net start MongoDB
   ```

#### Phương pháp 2: Chocolatey
```powershell
# Cài đặt Chocolatey (nếu chưa có)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Cài đặt MongoDB
choco install mongodb

# Khởi động service
net start MongoDB
```

### 🍎 macOS

#### Phương pháp 1: Homebrew (Khuyến nghị)
```bash
# Cài đặt Homebrew (nếu chưa có)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài đặt MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Khởi động MongoDB
brew services start mongodb-community
```

#### Phương pháp 2: MongoDB Installer
1. Tải từ: https://www.mongodb.com/try/download/community
2. Chọn **macOS** → **TGZ**
3. Giải nén và cài đặt theo hướng dẫn

### 🐧 Linux (Ubuntu/Debian)

#### Ubuntu 20.04+ / Debian 10+
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Tạo repository list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Cập nhật package database
sudo apt-get update

# Cài đặt MongoDB
sudo apt-get install -y mongodb-org

# Khởi động MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### CentOS/RHEL/Rocky Linux
```bash
# Tạo repository file
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# Cài đặt MongoDB
sudo yum install -y mongodb-org

# Khởi động MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🔍 Kiểm Tra MongoDB

### ✅ Kiểm Tra Service Status
```bash
# Windows
sc query MongoDB
# Hoặc
net start | findstr MongoDB

# macOS
brew services list | grep mongodb
# Hoặc
ps aux | grep mongod

# Linux
sudo systemctl status mongod
# Hoặc
sudo service mongod status
```

### ✅ Kiểm Tra Connection
```bash
# Kết nối MongoDB shell
mongosh
# Hoặc (phiên bản cũ)
mongo

# Test connection
show dbs
```

### ✅ Kiểm Tra Port
```bash
# Windows
netstat -an | findstr :27017

# macOS/Linux
lsof -i :27017
# Hoặc
ss -tulpn | grep :27017
```

## 🔧 Cấu Hình MongoDB

### 📁 Database Configuration
```javascript
// MongoDB sẽ tự động tạo database: game-server
// Connection string: mongodb://localhost:27017/game-server
```

### 🗂️ Collections sẽ được tạo tự động:
- `users` - Thông tin người dùng
- `line98games` - Trạng thái game Line 98
- `caromatches` - Lịch sử trận Caro

### ⚙️ Configuration File (Optional)
```yaml
# /etc/mongod.conf (Linux/macOS)
# C:\Program Files\MongoDB\Server\6.0\bin\mongod.cfg (Windows)

storage:
  dbPath: /var/lib/mongodb  # Linux
  # dbPath: C:\data\db      # Windows
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log  # Linux
  # path: C:\Program Files\Mongodb\Server\6.0\log\mongod.log  # Windows

net:
  port: 27017
  bindIp: 127.0.0.1  # Chỉ localhost

processManagement:
  timeZoneInfo: /usr/share/zoneinfo
```

## 🚀 Kết Nối với Dự Án

### 1. **Kiểm tra Connection String**
```typescript
// File: src/database/database.module.ts
MongooseModule.forRoot('mongodb://localhost:27017/game-server')
```

### 2. **Test Connection**
```bash
# Chạy server
npm run start:dev

# Kiểm tra logs
# Sẽ thấy: "Mongoose connected to MongoDB"
```

### 3. **Verify Database**
```bash
# Kết nối MongoDB shell
mongosh

# Chọn database
use game-server

# Xem collections
show collections

# Xem documents
db.users.find()
db.line98games.find()
db.caromatches.find()
```

## 🛠️ Troubleshooting

### ❌ **Lỗi: MongoDB Service không khởi động**

#### Windows:
```cmd
# Kiểm tra logs
type "C:\Program Files\MongoDB\Server\6.0\log\mongod.log"

# Restart service
net stop MongoDB
net start MongoDB

# Kiểm tra port conflict
netstat -an | findstr :27017
```

#### macOS:
```bash
# Kiểm tra logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Restart service
brew services stop mongodb-community
brew services start mongodb-community
```

#### Linux:
```bash
# Kiểm tra logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart service
sudo systemctl restart mongod

# Kiểm tra permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
```

### ❌ **Lỗi: Connection Refused**

1. **Kiểm tra MongoDB đang chạy**:
   ```bash
   # Windows
   sc query MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. **Kiểm tra Firewall**:
   ```bash
   # Windows
   # Control Panel → Windows Defender Firewall → Allow an app
   
   # Linux
   sudo ufw allow 27017
   
   # macOS
   # System Preferences → Security & Privacy → Firewall
   ```

3. **Kiểm tra Port**:
   ```bash
   # Test port
   telnet localhost 27017
   ```

### ❌ **Lỗi: Permission Denied**

#### Linux/macOS:
```bash
# Fix permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
sudo chmod 755 /var/lib/mongodb
sudo chmod 755 /var/log/mongodb
```

#### Windows:
```cmd
# Run Command Prompt as Administrator
# Restart MongoDB service
net stop MongoDB
net start MongoDB
```

### ❌ **Lỗi: Database Connection trong Node.js**

```bash
# Kiểm tra MongoDB connection
npm run start:dev

# Lỗi thường gặp:
# 1. MongoDB chưa khởi động
# 2. Port 27017 bị block
# 3. Connection string sai
# 4. Firewall blocking
```

## 🔄 Reset Database (Nếu Cần)

### 🗑️ Xóa Database
```bash
# Kết nối MongoDB shell
mongosh

# Chọn database
use game-server

# Xóa tất cả collections
db.dropDatabase()

# Hoặc xóa từng collection
db.users.drop()
db.line98games.drop()
db.caromatches.drop()

# Exit
exit
```

### 🔄 Restart với Clean Database
```bash
# Stop MongoDB
# Windows: net stop MongoDB
# macOS: brew services stop mongodb-community
# Linux: sudo systemctl stop mongod

# Xóa data directory (CẨN THẬN!)
# Windows: C:\data\db
# macOS: /usr/local/var/mongodb
# Linux: /var/lib/mongodb

# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

## 📊 MongoDB Monitoring

### 📈 Performance Monitoring
```bash
# MongoDB Compass (GUI)
# Download: https://www.mongodb.com/products/compass

# Command line monitoring
mongosh
db.serverStatus()
db.stats()
```

### 📝 Logs Location
```bash
# Windows
C:\Program Files\MongoDB\Server\6.0\log\mongod.log

# macOS
/usr/local/var/log/mongodb/mongo.log

# Linux
/var/log/mongodb/mongod.log
```

## 🎯 Best Practices

### ✅ **Security**
```bash
# 1. Chỉ bind localhost (development)
bindIp: 127.0.0.1

# 2. Enable authentication (production)
security:
  authorization: enabled

# 3. Tạo user admin
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["userAdminAnyDatabase"]
})
```

### ✅ **Performance**
```bash
# 1. Enable journaling
storage:
  journal:
    enabled: true

# 2. Set appropriate cache size
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1  # 1GB cho development
```

### ✅ **Backup**
```bash
# Backup database
mongodump --db game-server --out /backup/

# Restore database
mongorestore --db game-server /backup/game-server/
```

## 🎉 **Kết Luận**

Sau khi hoàn thành các bước trên:

1. ✅ **MongoDB đã được cài đặt** và khởi động
2. ✅ **Database `game-server`** sẽ được tạo tự động
3. ✅ **Collections** sẽ được tạo khi chạy server
4. ✅ **Connection string** đã được cấu hình đúng
5. ✅ **Server có thể kết nối** MongoDB thành công

### 🚀 **Bước Tiếp Theo**
```bash
# Chạy server
npm run start:dev

# Kiểm tra logs
# Sẽ thấy: "Mongoose connected to MongoDB"
# Database và collections sẽ được tạo tự động
```

**MongoDB đã sẵn sàng cho dự án Server Game!** 🎮✨