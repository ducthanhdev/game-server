/**
 * Kiểm tra thắng trong game Caro
 * @param board Bàn cờ 15x15 (0 = trống, 1 = X, 2 = O)
 * @param x Tọa độ x của nước đi vừa thực hiện
 * @param y Tọa độ y của nước đi vừa thực hiện
 * @returns true nếu thắng, false nếu chưa thắng
 */
export function isWin(board: number[][], x: number, y: number): boolean {
  const n = board.length;
  const me = board[y][x];
  if (!me) return false;

  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]] as const;

  for (const [dx, dy] of dirs) {
    let count = 1;
    
    // Đếm về phía trước
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || board[ny][nx] !== me) break;
      count++;
    }
    
    // Đếm về phía sau
    for (let i = 1; i < 5; i++) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || board[ny][nx] !== me) break;
      count++;
    }
    
    if (count >= 5) return true;
  }
  
  return false;
}

/**
 * Kiểm tra thắng và trả về thông tin chi tiết
 * @param board Bàn cờ 15x15
 * @param x Tọa độ x của nước đi vừa thực hiện
 * @param y Tọa độ y của nước đi vừa thực hiện
 * @returns Thông tin thắng hoặc null
 */
export function getWinInfo(board: number[][], x: number, y: number): { 
  isWin: boolean; 
  line?: { from: { x: number; y: number }; to: { x: number; y: number } } 
} | null {
  const n = board.length;
  const me = board[y][x];
  if (!me) return null;

  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]] as const;

  for (const [dx, dy] of dirs) {
    let count = 1;
    let startX = x, startY = y;
    let endX = x, endY = y;
    
    // Đếm về phía trước
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || board[ny][nx] !== me) break;
      count++;
      endX = nx;
      endY = ny;
    }
    
    // Đếm về phía sau
    for (let i = 1; i < 5; i++) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || board[ny][nx] !== me) break;
      count++;
      startX = nx;
      startY = ny;
    }
    
    if (count >= 5) {
      return {
        isWin: true,
        line: { from: { x: startX, y: startY }, to: { x: endX, y: endY } }
      };
    }
  }
  
  return { isWin: false };
}
