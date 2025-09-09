# Hướng dẫn cài đặt MongoDB

## Cài đặt MongoDB

### Windows
1. Tải MongoDB Community Server từ: https://www.mongodb.com/try/download/community
2. Chạy file installer và làm theo hướng dẫn
3. Khởi động MongoDB service:
   ```cmd
   net start MongoDB
   ```

### macOS
```bash
# Sử dụng Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Kiểm tra MongoDB đã chạy

```bash
# Kiểm tra status
# Windows
sc query MongoDB

# macOS/Linux
brew services list | grep mongodb
# hoặc
sudo systemctl status mongod
```

## Kết nối MongoDB

MongoDB sẽ chạy trên:
- **Host**: localhost
- **Port**: 27017
- **Database**: game-server (sẽ được tạo tự động)

## Troubleshooting

### Lỗi kết nối MongoDB
1. Kiểm tra MongoDB đã khởi động chưa
2. Kiểm tra port 27017 có bị block không
3. Kiểm tra firewall settings

### Lỗi permission
```bash
# Linux/macOS
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
```

### Reset MongoDB (nếu cần)
```bash
# Xóa database cũ
mongo
use game-server
db.dropDatabase()
exit
```
