import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  @Get()
  getHome(@Res() res: Response) {
    res.sendFile('index.html', { root: 'public' });
  }


}
