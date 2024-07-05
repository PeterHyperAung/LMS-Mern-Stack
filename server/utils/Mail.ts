import path from "path";

import nodemailer from "nodemailer";
import ejs from "ejs";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: string };
}

export class Mail {
  transporter: nodemailer.Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendMail(options: EmailOptions) {
    const { email, subject, data, template } = options;

    const message = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject,
      html: await ejs.renderFile(
        path.join(__dirname, `../mailTemplates/${template}`),
        data
      ),
    };

    await this.transporter.sendMail(message);
  }

  async sendActivationEmail(email: string, activationCode: string) {
    await this.sendMail({
      email,
      subject: "Activate your account",
      template: "activation-mail.ejs",
      data: { activationCode },
    });
  }
}

export const mailer = new Mail();
