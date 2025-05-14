// Mock de las funciones de utilidad para correos
export const addSignature = jest.fn(
  (content) => `${content}<p>Saludos,<br>El equipo de MVA</p>`,
);

export const generateEmailContent = jest.fn(
  (title, body) => `
  <div style="font-family: Arial, sans-serif;">
    <h1>${title}</h1>
    <div>${body}</div>
  </div>
`,
);
