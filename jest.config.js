module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^src/salary_advance/entities/salary_advance.entity$':
      '<rootDir>/__mocks__/src/salary_advance/entities/salary_advance.entity.ts',
    '^src/clothing/entities/clothing.entity$':
      '<rootDir>/__mocks__/src/clothing/entities/clothing.entity.ts',
    '^src/users/entities/user.entity$':
      '<rootDir>/__mocks__/src/users/entities/user.entity.ts',
    '^src/employees/entities/emergencyContacts.entity$':
      '<rootDir>/__mocks__/src/employees/entities/emergencyContacts.entity.ts',
    '^src/employees/entities/license.entity$':
      '<rootDir>/__mocks__/src/employees/entities/license.entity.ts',
    '^src/employees/entities/examenPreocupacional.entity$':
      '<rootDir>/__mocks__/src/employees/entities/examenPreocupacional.entity.ts',
    // Añade aquí otras entidades que necesites mockear
  },
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
