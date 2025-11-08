import nodemailer from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;         // Base64 string
  contentType?: string;
  disposition?: string;
  encoding?: 'base64';     // specify encoding since content is Base64
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[]; // ✅ allow attachments
}

export interface MeetingDetails {
  startTime: string;
  endTime: string;
  summary: string;
  meetLink?: string;
  eventLink?: string;
}

class EmailService {
  // ✅ Instead of Transporter, infer the type safely
  private transporter: ReturnType<typeof nodemailer.createTransport>;

  constructor() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_MEET_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailHost || !emailPort || !emailUser || !emailPassword) {
      throw new Error('Email configuration is incomplete');
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `<${process.env.EMAIL_MEET_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        attachments: emailData.attachments, // ✅ include attachments
      });
      console.log(`Email sent successfully to ${emailData.to}`);
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send email';
      throw new Error(errorMessage);
    }
  }

  generateCustomerEmailTemplate(
    customerName: string,
    meetingDetails: MeetingDetails,
    meetLink?: string,
    customMessage?: string

  ): string {
    const meetingDate = new Date(meetingDetails.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const meetingTime = new Date(meetingDetails.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const duration = "ساعه ونصف";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #214E78; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .meeting-link { 
            display: inline-block; 
            background: #4F46E5; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-size: 16px;
            font-weight: bold;
          }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4F46E5; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>تم الحجز بنجاح</h1>
          </div>
          <div class="content">
            <p>مرحبا  <strong>${customerName}</strong>,</p>
            <p> ${customMessage?.replace(`(اسم العميل)`, customerName).replace("تاريخ و يوم", meetingDate).replace("ووقت", meetingTime)}</p>
            
            <div class="details">
              <h3>📅 تفاصيل الاجتماع:</h3>
              <p><strong>النوع:</strong> ${meetingDetails.summary}</p>
              <p><strong>التاريخ:</strong> ${meetingDate}</p>
              <p><strong>الوقت:</strong> ${meetingTime}</p>
              <p><strong>المده:</strong> ${duration}</p>
            </div>

            ${meetLink ? `
            <p><strong>Join your session using this link:</strong></p>
            <a href="${meetLink}" class="meeting-link">Join Google Meet</a>
            <p><em>الرابط سيصبح متاح قبل الموعد ب 15 دقيقه.</em></p>
            ` : `
            <p><strong>Meeting Link:</strong> The Google Meet link will be available in your calendar event. Please check your Google Calendar for the meeting link.</p>
            <a href="https://calendar.google.com" class="meeting-link">Open Google Calendar</a>
            `}

        </div>
        </div>

      </body>
      </html>
    `;
  }

  generateAdminEmailTemplate(
    customerName: string,
    customerEmail: string,
    meetingDetails: MeetingDetails,
    meetLink?: string
  ): string {
    const meetingDate = new Date(meetingDetails.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const meetingTime = new Date(meetingDetails.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const duration = "ساعه ونصف";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #214E78; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .meeting-link { 
            display: inline-block; 
            background: #214E78; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-size: 16px;
            font-weight: bold;
          }
          .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #214E78; }
          .customer-info { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>تم حجز جديد</h1>
          </div>
          <div class="content">
            <pمرحبا,</p>
            <p>تم حجز جلسه جديده تفاصيلها في الاسفل </p>
            
            <div class="customer-info">
              <h3>👤 بيانات العميل :</h3>
              <p><strong>الاسم:</strong> ${customerName}</p>
              <p><strong>الايميل:</strong> ${customerEmail}</p>
            </div>

            <div class="details">
              <h3>📅 تفاصيل الحجز :</h3>
              <p><strong> نوع الحجز :</strong> ${meetingDetails.summary == "inPerson" ? "استماع ولقاء" : "استماع"}</p>
              <p><strong>التاريخ :</strong> ${meetingDate}</p>
              <p><strong> الوقت :</strong> ${meetingTime}</p>
              <p><strong>المده:</strong> ${duration}</p>
              
            </div>

            ${meetLink ? `
            <p><strong>Join the session:</strong></p>
            <a href="${meetLink}" class="meeting-link">Join Google Meet</a>
            ` : `
            <p><strong>Meeting Link:</strong> Available in your Google Calendar</p>
            <a href="https://calendar.google.com" class="meeting-link">Open Google Calendar</a>
            `}


            <p><strong تم اضافة الحجز الي التقويم الخاص بك تلقائيا. </strong></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();