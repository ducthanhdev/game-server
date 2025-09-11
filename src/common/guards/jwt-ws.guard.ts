import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    try {
      // Lấy token từ auth hoặc query
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        client.data.user = null;
        return false;
      }

      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      });

      // Gắn user vào client data
      client.data.user = {
        id: payload.sub,
        username: payload.username,
      };

      return true;
    } catch (error) {
      client.data.user = null;
      return false;
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    if (client.handshake.auth?.token) {
      const token = client.handshake.auth.token;
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (client.handshake.query?.token) {
      const token = client.handshake.query.token as string;
      return token.startsWith('Bearer ') ? token.substring(7) : token;
    }

    return null;
  }
}
