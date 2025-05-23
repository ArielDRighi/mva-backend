// mailer/utils/mailer.utils.ts
export function addSignature(content: string): string {
  return `${content}<p>Saludos,<br>El equipo de MVA</p>`;
}

export function generateEmailContent(title: string, body: string): string {
  return addSignature(`
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #7E3AF2; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${title}</h1>
        </div>
        <div style="padding: 20px;">
          ${body}
        </div>
        <div style="background-color: #f4f4f4; color: #777; padding: 10px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">© 2025 MVA SRL. Todos los derechos reservados.</p>
        </div>
      </div>
    `);
}
