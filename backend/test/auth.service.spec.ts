import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { User } from '../src/database/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  beforeEach(async () => {
    const mockUserModelValue = {
      findOne: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtServiceValue = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModelValue,
        },
        {
          provide: JwtService,
          useValue: mockJwtServiceValue,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUserModel = module.get(getModelToken(User.name));
    mockJwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      const username = 'testuser';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const mockUser = {
        _id: 'user-id',
        username,
        password: hashedPassword,
        email: 'test@example.com',
        toObject: jest.fn().mockReturnValue({
          _id: 'user-id',
          username,
          password: hashedPassword,
          email: 'test@example.com',
        }),
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

      const result = await service.validateUser(username, password);

      expect(result).toBeDefined();
      expect(result.username).toBe(username);
      expect(result.password).toBeUndefined();
    });

    it('should return null when credentials are invalid', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';

      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.validateUser(username, password);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', () => {
      const user = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
      };
      const mockToken = 'mock-jwt-token';

      mockJwtService.sign.mockReturnValue(mockToken);

      const result = service.login(user);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
        },
      });
    });
  });

  describe('register', () => {
    it('should register a new user and return login response', async () => {
      const username = 'newuser';
      const password = 'password123';
      const email = 'new@example.com';
      const nickname = 'New User';

      const mockUser = {
        _id: 'user-id',
        username,
        password: 'hashed-password',
        email,
        nickname,
        save: jest.fn().mockResolvedValue({
          _id: 'user-id',
          username,
          password: 'hashed-password',
          email,
          nickname,
          toObject: jest.fn().mockReturnValue({
            _id: 'user-id',
            username,
            password: 'hashed-password',
            email,
            nickname,
          }),
        }),
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.new = jest.fn().mockReturnValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as any);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(username, password, email, nickname);

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should throw error when username already exists', async () => {
      const username = 'existinguser';
      const password = 'password123';

      const existingUser = {
        _id: 'user-id',
        username,
        password: 'hashed-password',
      };

      mockUserModel.findOne.mockResolvedValue(existingUser);

      await expect(service.register(username, password)).rejects.toThrow('Username already exists');
    });
  });
});
