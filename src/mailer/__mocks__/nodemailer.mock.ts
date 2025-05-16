// Mock de nodemailer para pruebas
export const mockSendMail = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

const mockTransporter = {
  sendMail: mockSendMail,
  verify: jest.fn().mockImplementation(() => Promise.resolve(true)),
};

export const createTransport = jest
  .fn()
  .mockImplementation(() => mockTransporter);

// Reiniciar los mocks para pruebas
export const resetMocks = () => {
  mockSendMail.mockClear();
  createTransport.mockClear();
};
