// src/app/api/send-meeting-emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emailService, EmailAttachment } from '../../../lib/emailService';
import jsPDF from 'jspdf';

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
    type?:
    | 'free_trial'
    | 'reservation'
    | 'edit'
    | 'complete_reservation'
    | 'cancel_reservation'
    | 'apply';
    pdfInvoice?: string; // Base64 PDF string
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
            type = 'reservation',
            pdfInvoice,
        } = body;

        // Validate required fields
        if (!customerName || !customerEmail || !meetingDetails) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields for emails' },
                { status: 400 }
            );
        }

        // Fetch custom texts
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const textsResponse = await fetch(`${baseUrl}/api/get-final-page-texts`, { cache: 'no-store' });
        if (!textsResponse.ok) throw new Error(`Failed to fetch texts: ${textsResponse.statusText}`);

        const data: GetTextsResponse = await textsResponse.json();
        const customMessage = data.success && Array.isArray(data.data)
            ? data.data.find(row => row.type === type)?.text_ar ?? ''
            : '';

        // ✅ FIX: Convert Base64 string to Buffer
        const attachments: EmailAttachment[] | undefined = pdfInvoice
            ? [
                {
                    filename: "invoice.pdf",
                    content: Buffer.from(pdfInvoice.replace(/\s+/g, ''), 'base64'), // Convert to Buffer
                    contentType: "application/pdf",
                },
            ]
            : undefined;

        const emailPromises: Promise<void>[] = [];

        // Send email to customer
        console.log("Sending email with PDF attachment:", !!pdfInvoice);
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
                attachments,
            })
        );

        // Send email to admin
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
                    attachments, // optionally attach the same PDF to admin
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
            { success: false, message: 'Failed to send emails', error: errorMessage },
            { status: 500 }
        );
    }
}