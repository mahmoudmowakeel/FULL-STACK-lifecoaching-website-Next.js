import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';

export interface FinalPageText {
    id: number;
    type:
    | 'free_trial'
    | 'reservation'
    | 'edit'
    | 'complete_reservation'
    | 'cancel_reservation'
    | 'apply';
    text_ar: string;
    text_en: string;
}

interface EmailRequest {
    customerName: string;
    customerEmail: string;
    type: FinalPageText['type'];
    date_time?: string; // optional
}

interface GetTextsResponse {
    success: boolean;
    data: FinalPageText[];
}

export async function POST(request: NextRequest) {
    try {
        const body: EmailRequest = await request.json();
        const { customerName, customerEmail, type, date_time } = body;

        if (!customerName || !customerEmail || !type) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // ✅ Fetch the Arabic message text
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/get-final-page-texts`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch texts: ${response.statusText}`);
        }

        const data: GetTextsResponse = await response.json();

        const found = data.data.find((row) => row.type === type);
        const messageText = found?.text_ar ?? '';

        if (!messageText) {
            return NextResponse.json(
                { success: false, message: 'No message found for this type' },
                { status: 404 }
            );
        }
        const date = new Date(new Date(date_time as string));
        const formatted = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

        // ✅ Simple styled Arabic email
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #214E78; padding: 16px; direction: rtl;">
        <h2>مرحباً ${customerName}</h2>
        <p>${messageText.replace(`(اسم العميل)`, customerName).replace("تاريخ و يوم", formatted).replace("ووقت", "")}</p>
        <br/>
        <p style="font-size: 12px; color: #777;">شكرا لاختيارك لنا</p>
      </div>
    `;

        // ✅ Send email to customer only
        await emailService.sendEmail({
            to: customerEmail,
            subject: 'شركة استفهام',
            html: htmlContent,
        });

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully to customer',
            emailSent: customerEmail,
        });
    } catch (error: unknown) {
        console.error('Email sending error:', error);
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { success: false, message: 'Failed to send email', error: errorMessage },
            { status: 500 }
        );
    }
}
