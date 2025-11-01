// app/api/send-verification-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// In-memory store for verification codes (use a database in production)
const verificationCodes = new Map();

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Generate random 6-digit code
function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();

        // Store code with expiration (10 minutes)
        verificationCodes.set(email, {
            code: verificationCode,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0 // Track verification attempts
        });

        // Create transporter and send email
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER!,
            to: email,
            subject: 'كود التحقق - شركة استفهام',
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
      <p>مرحباً، ${email.split("@")[0]}</p>
      <p>تم طلب كود التحقق الخاص بك:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #ffffff; background-color: #214E78; padding: 10px 20px; border-radius: 8px; display: inline-block;">
        <span>كود التحقق الخاص بك</span>
          ${verificationCode}
        </div>
      </div>
      <p>إذا لم تقم بطلب كود التحقق، برجاء تجاهل هذه الرسالة.</p>
      <br>
      <p>شكراً لاهتمامك،<br>شركة استفهام</p>
    </div>`,
        };


        await transporter.sendMail(mailOptions);

        // In development, you might want to return the code for testing
        const isDevelopment = process.env.NODE_ENV === 'development';

        return NextResponse.json({
            message: 'Verification code sent successfully',
            ...(isDevelopment && { debugCode: verificationCode }), code: verificationCode// Only return code in development
        });

    } catch (error) {
        console.error('Error sending verification code:', error);
        return NextResponse.json(
            { error: 'Failed to send verification code, Please Try Again' },
            { status: 500 }
        );
    }
}