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

  @Get('app.js')
  getAppJs(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'app.js');
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Get('test.html')
  getTestHtml(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'test.html');
    if (existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  }
}
