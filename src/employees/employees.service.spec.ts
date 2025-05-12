// For now, we have basic tests in this file
// Future implementation will include full service tests

import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Empleado } from './entities/employee.entity';
import { Licencias } from './entities/license.entity';
import { ContactosEmergencia } from './entities/emergencyContacts.entity';
import { ExamenPreocupacional } from './entities/examenPreocupacional.entity';

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getRepositoryToken(Empleado), useValue: {} },
        { provide: getRepositoryToken(Licencias), useValue: {} },
        { provide: getRepositoryToken(ContactosEmergencia), useValue: {} },
        { provide: getRepositoryToken(ExamenPreocupacional), useValue: {} },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
