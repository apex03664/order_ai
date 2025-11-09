import nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error(`Email service initialization error: ${error.message}`);
        } else {
          logger.info('Email service initialized successfully');
        }
      });
    } catch (error) {
      logger.error(`Email transporter error: ${error.message}`);
    }
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `"AI Manager" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || process.env.SMTP_USER
      };

      if (options.cc) mailOptions.cc = options.cc;
      if (options.bcc) mailOptions.bcc = options.bcc;
      if (options.attachments) mailOptions.attachments = options.attachments;

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Email send error: ${error.message}`);
      throw error;
    }
  }

  generatePersonalizedEmail(template, variables) {
    let emailContent = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      emailContent = emailContent.replace(regex, variables[key] || '');
    });
    return emailContent;
  }

  async sendPersonalizedEmail(to, template, variables, subject) {
    const htmlContent = this.generatePersonalizedEmail(template, variables);
    return await this.sendEmail({
      to,
      subject,
      html: htmlContent
    });
  }
}

export default new EmailService();

