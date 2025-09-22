import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para 465, false para outras portas
  auth: {
    user: 'newstrustdev@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Use app password for Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Rota para envio de email de contato
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    console.log('📧 Recebida solicitação de contato:', { name, email, messageLength: message?.length });

    // Validação básica
    if (!name || !email || !message) {
      console.log('❌ Validação falhou:', { name: !!name, email: !!email, message: !!message });
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    // Configuração do email
    const mailOptions = {
      from: 'newstrustdev@gmail.com',
      to: 'newstrustdev@gmail.com',
      subject: `Contato NewsTrust - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nova mensagem de contato - NewsTrust</h2>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Informações do contato:</h3>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #374151; margin-top: 0;">Mensagem:</h3>
            <p style="line-height: 1.6; color: #4b5563;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>NewsTrust</strong> - Sistema de verificação de notícias<br>
              Enviado em: ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      `
    };

    // Verificar configuração do transporter
    console.log('🔧 Verificando configuração do transporter...');
    await transporter.verify();
    console.log('✅ Transporter configurado corretamente');

    // Envio do email
    console.log('📤 Enviando email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de contato enviado com sucesso:', { 
      name, 
      email, 
      messageId: info.messageId 
    });

    res.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!' 
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de contato:', error);
    console.error('❌ Detalhes do erro:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor. Tente novamente.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
