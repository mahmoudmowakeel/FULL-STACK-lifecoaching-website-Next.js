import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startTime, endTime, summary, description } = body;

        if (!startTime || !endTime) {
            return NextResponse.json(
                { success: false, error: 'Missing startTime or endTime' },
                { status: 400 }
            );
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        const calendar = google.calendar({ version: 'v3', auth });

        // Base event structure
        const baseEvent = {
            summary: summary || 'Life Coaching Session',
            description: description || 'Your coaching session is scheduled.',
            start: {
                dateTime: new Date(startTime).toISOString(),
                timeZone: 'Africa/Cairo',
            },
            end: {
                dateTime: new Date(endTime).toISOString(),
                timeZone: 'Africa/Cairo',
            },
        };

        // Try adding Google Meet conference data
        const eventWithMeet = {
            ...baseEvent,
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        let result;

        try {
            // Try to create event with Meet link
            result = await calendar.events.insert({
                calendarId: process.env.GOOGLE_CALENDAR_ID!,
                requestBody: eventWithMeet,
                conferenceDataVersion: 1,
            });
        } catch (err) {
            const error = err as Error;
            console.warn('⚠️ Could not generate Meet link:', error.message);

            // Fall back to creating a standard event
            result = await calendar.events.insert({
                calendarId: process.env.GOOGLE_CALENDAR_ID!,
                requestBody: baseEvent,
            });
        }

        const eventData = result.data;
        const meetLink =
            eventData.hangoutLink ||
            eventData.conferenceData?.entryPoints?.[0]?.uri ||
            null;

        return NextResponse.json({
            success: true,
            eventId: eventData.id,
            eventLink: eventData.htmlLink,
            hangoutLink: meetLink,
            message: meetLink
                ? '✅ Event created successfully with a Google Meet link!'
                : '✅ Event created successfully (no Meet link available).',
        });
    } catch (err) {
        const error = err as Error;
        console.error('Error creating event:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
