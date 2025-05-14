import { Test, TestingModule } from '@nestjs/testing';
import { MailerInterceptor } from './mailer.interceptor';
import { MailerService } from '../mailer.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('MailerInterceptor', () => {
  let interceptor: MailerInterceptor;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerInterceptor,
        {
          provide: MailerService,
          useValue: {
            sendRoute: jest.fn(),
            sendRouteModified: jest.fn(),
            sendMail: jest.fn(),
            getAdminEmails: jest.fn(),
            getSupervisorEmails: jest.fn(),
            sendServiceNotification: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
            sendPasswordChangeConfirmationEmail: jest.fn(),
            sendInProgressNotification: jest.fn(),
            sendCompletionNotification: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<MailerInterceptor>(MailerInterceptor);
    mailerService = module.get<MailerService>(MailerService);
  });
  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
