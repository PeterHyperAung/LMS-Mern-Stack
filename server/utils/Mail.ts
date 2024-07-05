import path from "path";

import nodemailer from "nodemailer";
import ejs from "ejs";
import { IRegistrationBody } from "../controllers/user.controller";

interface EmailOptions<T> {
  email: string;
  subject: string;
  template: string;
  data: T;
}

export class Mailer {
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

  async sendMail<T>(options: EmailOptions<T>) {
    const { email, subject, data, template } = options;

    console.log(__dirname);
    const message = {
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject,
      html: await ejs.renderFile(
        path.join(__dirname, `../mailTemplates/${template}`),
        data as unknown as Record<string, string>
      ),
    };

    await this.transporter.sendMail(message);
  }

  async sendActivationEmail(
    email: string,
    data: { activationCode: string; user: IRegistrationBody }
  ) {
    await this.sendMail({
      email,
      subject: "Activate your account",
      template: "activation-mail.ejs",
      data,
    });
  }
}
