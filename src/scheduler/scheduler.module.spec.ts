// filepath: d:\Personal\mva-backend\src\scheduler\scheduler.module.spec.ts
import { Test } from '@nestjs/testing';
import { SchedulerModule } from './scheduler.module';
import { ContractExpirationService } from './services/contract-expiration.service';
import { EmployeeLeaveSchedulerService } from './services/employee-leave-scheduler.service';

describe('SchedulerModule', () => {
  it('should compile the module', () => {
    expect(() => {
      const module = new SchedulerModule();
      expect(module).toBeDefined();
    }).not.toThrow();
  });
});
