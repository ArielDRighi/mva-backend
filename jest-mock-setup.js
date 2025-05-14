// Mock de entidades externas para evitar errores de importación
jest.mock(
  'src/salary_advance/entities/salary_advance.entity',
  () => ({
    SalaryAdvance: class SalaryAdvance {},
  }),
  { virtual: true },
);

jest.mock(
  'src/clothing/entities/clothing.entity',
  () => ({
    RopaTalles: class RopaTalles {},
  }),
  { virtual: true },
);

jest.mock(
  './src/employees/entities/emergencyContacts.entity',
  () => ({
    ContactosEmergencia: class ContactosEmergencia {},
  }),
  { virtual: true },
);

jest.mock(
  './src/employees/entities/license.entity',
  () => ({
    Licencias: class Licencias {},
  }),
  { virtual: true },
);

jest.mock(
  './src/users/entities/user.entity',
  () => ({
    User: class User {},
  }),
  { virtual: true },
);

jest.mock(
  './src/employees/entities/preocupational_exam.entity',
  () => ({
    ExamenPreocupacional: class ExamenPreocupacional {},
  }),
  { virtual: true },
);

jest.mock(
  './employees/entities/examenPreocupacional.entity',
  () => ({
    ExamenPreocupacional: class ExamenPreocupacional {},
  }),
  { virtual: true },
);

jest.mock(
  './users/entities/user.entity',
  () => ({
    User: class User {},
  }),
  { virtual: true },
);
