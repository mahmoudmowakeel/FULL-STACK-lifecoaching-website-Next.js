// src/app/api/send-meeting-emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../lib/emailService';

interface EmailRequest {
    customerName: string;
    customerEmail: string;
    meetingDetails: {
        startTime: string;
        endTime: string;
        summary: string;
        meetLink?: string;
        eventLink?: string;
    };
    type: string
}

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

interface GetTextsResponse {
    success: boolean;
    data: FinalPageText[];
}

export async function POST(request: NextRequest) {
    try {
        const body: EmailRequest = await request.json();

        const {
            customerName,
            customerEmail,
            meetingDetails,
            type = 'reservation'
        } = body;

        // Validate required fields
        if (!customerName || !customerEmail || !meetingDetails) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Missing required fields for emails'
                },
                { status: 400 }
            );
        }
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/get-final-page-texts`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch texts: ${response.statusText}`);
        }

        const data: GetTextsResponse = await response.json();

        let customMessage = '';
        if (data.success && Array.isArray(data.data)) {
            const found = data.data.find((row) => row.type === type);
            customMessage = found?.text_ar ?? '';
        }

        const emailPromises = [];

        // Send email to customer
        emailPromises.push(
            emailService.sendEmail({
                to: customerEmail,
                subject: `تم تأكيد حجزك بنجاح`,
                html: emailService.generateCustomerEmailTemplate(
                    customerName,
                    meetingDetails,
                    meetingDetails.meetLink,
                    customMessage
                ),
            })
        );

        // Send email to admin (you)
        const adminEmail = process.env.EMAIL_MEET_USER;
        if (adminEmail) {
            emailPromises.push(
                emailService.sendEmail({
                    to: adminEmail,
                    subject: `حجز جديد`,
                    html: emailService.generateAdminEmailTemplate(
                        customerName,
                        customerEmail,
                        meetingDetails,
                        meetingDetails.meetLink
                    ),
                })
            );
        }

        // Wait for all emails to be sent
        await Promise.all(emailPromises);

        return NextResponse.json({
            success: true,
            message: 'Emails sent successfully to both customer and admin',
            emailsSent: {
                customer: customerEmail,
                admin: adminEmail,
            },
        });

    } catch (error: unknown) {
        console.error('Email sending error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to send emails',
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}