// src/app/api/send-meeting-emails/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '../../../lib/emailService';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

interface FinalPageText {
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
        const { customerName, customerEmail, meetingDetails, type = 'reservation', pdfInvoice } = body;

        // Validate required fields
        if (!customerName || !customerEmail || !meetingDetails) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
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

        // Handle PDF - Store it and create download link
        let pdfDownloadLink = '';
        let attachments = [];

        if (pdfInvoice) {
            try {
                const cleanBase64 = pdfInvoice.replace(/\s/g, '');
                const pdfBuffer = Buffer.from(cleanBase64, 'base64');

                // Create temp directory if it doesn't exist
                const tempDir = join(process.cwd(), 'temp');
                if (!existsSync(tempDir)) {
                    mkdirSync(tempDir, { recursive: true });
                }

                // Generate unique file name
                const fileName = `invoice_${Date.now()}.pdf`;
                const filePath = join(tempDir, fileName);

                // Save PDF file
                writeFileSync(filePath, pdfBuffer);

                // Create secure download link
                pdfDownloadLink = `${baseUrl}/api/download-invoice?file=${fileName}`;

                console.log('PDF saved successfully:', pdfDownloadLink);

                // Also attach PDF to email as proper attachment
                attachments = [{
                    filename: 'invoice.pdf',
                    content: cleanBase64,
                    contentType: 'application/pdf',
                    encoding: 'base64'
                }];

            } catch (err) {
                console.error('Failed to process PDF:', err);
            }
        }

        // Prepare email promises
        const emailPromises: Promise<void>[] = [];

        // Send email to customer
        emailPromises.push(
            emailService.sendEmail({
                to: customerEmail,
                subject: `تم تأكيد حجزك بنجاح`,
                html: emailService.generateCustomerEmailTemplate(
                    customerName,
                    meetingDetails,
                    meetingDetails.meetLink,
                    customMessage,
                    '', // content
                    pdfDownloadLink // Pass the download link instead of base64
                ),
                // attachments,
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
                        meetingDetails.meetLink,
                        '', // content
                        pdfDownloadLink // Pass the download link instead of base64
                    ),
                    // attachments,
                })
            );
        }

        await Promise.all(emailPromises);

        return NextResponse.json({
            success: true,
            message: 'Emails sent successfully to both customer and admin',
            emailsSent: {
                customer: customerEmail,
                admin: adminEmail,
            },
            pdfLink: pdfDownloadLink || 'No PDF attached'
        });

    } catch (error: unknown) {
        console.error('Email sending error:', error instanceof Error ? error.stack : error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { success: false, message: 'Failed to send emails', error: errorMessage },
            { status: 500 }
        );
    }
}