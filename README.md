# Server Game - Line 98 & Cờ Caro X O

Dự án server game được phát triển bằng NestJS với hai trò chơi: Line 98 và Cờ Caro X O.

## Tính năng

### Quản lý tài khoản
- ✅ Đăng ký và đăng nhập với username/password
- ✅ Mã hóa mật khẩu bằng bcrypt
- ✅ JWT token xác thực
- ✅ Cập nhật thông tin người dùng (email, nickname)

### Trò chơi Line 98
- ✅ Lưới 9x9 với 5 màu bóng
- ✅ Di chuyển bóng để tạo hàng 5 bóng cùng màu
- ✅ Sinh ngẫu nhiên 3 bóng mới sau mỗi lượt
- ✅ Giao diện HTML5 Canvas với hiệu ứng
- ✅ Tính năng gợi ý nước đi
- ✅ WebSocket đồng bộ trạng thái
- ✅ Lưu trạng thái vào database

### Trò chơi Cờ Caro X O
- ✅ Bàn chơi 15x15, hai người chơi
- ✅ Thắng khi tạo hàng 5 ký hiệu liên tiếp
- ✅ Chế độ trực tuyến với WebSocket
- ✅ Ghép cặp ngẫu nhiên
- ✅ Giao diện HTML5 Canvas
- ✅ Lưu lịch sử trận đấu

## Công nghệ sử dụng

- **Backend**: NestJS, Mongoose, MongoDB
- **Authentication**: JWT, Passport, bcrypt
- **Real-time**: WebSocket (Socket.IO)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Testing**: Jest, ts-jest

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 4.4.0

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd server-game
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Khởi động MongoDB
```bash
# Khởi động MongoDB service
# Trên Windows: net start MongoDB
# Trên macOS: brew services start mongodb-community
# Trên Linux: sudo systemctl start mongod
```

### Bước 4: Chạy ứng dụng

#### Development mode
```bash
npm run start:dev
```

#### Production mode
```bash
npm run build
npm run start:prod
```

### Bước 5: Truy cập ứng dụng
Mở trình duyệt và truy cập: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập
- `GET /auth/profile` - Lấy thông tin profile (cần JWT)

### Users
- `PUT /users/profile` - Cập nhật thông tin người dùng (cần JWT)

### WebSocket Events

#### Line 98
- `selectBall` - Chọn bóng
- `moveBall` - Di chuyển bóng
- `getHint` - Lấy gợi ý
- `newGame` - Trò chơi mới

#### Cờ Caro
- `createGame` - Tạo phòng
- `joinGame` - Tham gia phòng
- `findMatch` - Tìm trận
- `makeMove` - Đi nước cờ

## Chạy Unit Tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:cov

# Chạy tests ở chế độ watch
npm run test:watch
```

## Cấu trúc dự án

```
server-game/
├── src/
│   ├── auth/                 # Module xác thực
│   ├── users/                # Module quản lý người dùng
│   ├── games/
│   │   ├── line98/          # Trò chơi Line 98
│   │   └── caro/            # Trò chơi Cờ Caro
│   ├── database/            # Database entities
│   └── common/              # Utilities chung
├── public/                  # Frontend files
│   ├── index.html
│   └── app.js
├── test/                    # Unit tests
└── dist/                    # Build output
```

## Database Schema

### Users
- `id` (Primary Key)
- `username` (Unique)
- `password` (Hashed)
- `email`
- `nickname`
- `createdAt`
- `updatedAt`

### Line98 Games
- `id` (Primary Key)
- `playerId` (Foreign Key)
- `gameState` (JSON)
- `score`
- `isGameOver`
- `createdAt`

### Caro Games
- `id` (Primary Key)
- `player1Id` (Foreign Key)
- `player2Id` (Foreign Key)
- `board` (JSON)
- `currentPlayer`
- `winnerId`
- `isGameOver`
- `createdAt`

## Performance

- Hỗ trợ ít nhất 10 người chơi đồng thời
- Latency < 200ms
- Sử dụng WebSocket cho real-time communication
- MongoDB database cho lưu trữ dữ liệu

## Troubleshooting

### Lỗi kết nối database
- Kiểm tra MongoDB service đã khởi động chưa
- Kiểm tra kết nối đến `mongodb://localhost:27017/game-server`
- Đảm bảo quyền ghi file trong thư mục dự án

### Lỗi WebSocket
- Kiểm tra port 3000 không bị chiếm dụng
- Đảm bảo CORS được cấu hình đúng

### Lỗi authentication
- Kiểm tra JWT secret key
- Đảm bảo token được gửi đúng format

## License

ISC License
