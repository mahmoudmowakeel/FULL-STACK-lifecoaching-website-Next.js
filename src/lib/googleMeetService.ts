// lib/googleMeetService.ts
import { google, calendar_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface ReservationDetails {
    customerName: string;
    customerEmail: string;
    meetingDate: string;
    meetingTime: string;
    duration: number;
    topic?: string;
}

export interface GoogleMeetEvent {
    id: string;
    meetLink: string;
    startTime: string;
    endTime: string;
    summary: string;
}

interface GoogleAuthCredentials {
    client_email: string;
    private_key: string;
}

class GoogleMeetService {
    private calendar: calendar_v3.Calendar;
    private auth: JWT;

    constructor() {
        const credentials: GoogleAuthCredentials = {
            client_email: process.env.GOOGLE_CLIENT_EMAIL || '',
            private_key: (process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''),
        };

        if (!credentials.client_email || !credentials.private_key) {
            throw new Error('Google Cloud credentials are not properly configured');
        }

        this.auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    }


    // In your googleMeetService.ts - update the createMeeting method
    async createMeeting(reservation: ReservationDetails): Promise<GoogleMeetEvent> {
        try {
            const startTime = new Date(`${reservation.meetingDate}T${reservation.meetingTime}`);
            const endTime = new Date(startTime.getTime() + reservation.duration * 60000);

            const event = {
                summary: reservation.topic || `Meeting with ${reservation.customerName}`,
                description: `Meeting with ${reservation.customerName}`,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'Africa/Cairo',
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'Africa/Cairo',
                },
                attendees: [
                    {
                        email: reservation.customerEmail,
                        displayName: reservation.customerName
                    },
                    {
                        email: process.env.GOOGLE_CALENDAR_ID
                    },
                ],
            };

            const response = await this.calendar.events.insert({
                calendarId: process.env.GOOGLE_CALENDAR_ID || '',
                requestBody: event,
                sendUpdates: 'all',
            });

            const eventId = response.data.id;
            const summary = response.data.summary;
            const startDateTime = response.data.start?.dateTime;
            const endDateTime = response.data.end?.dateTime;

            if (!eventId || !startDateTime || !endDateTime || !summary) {
                throw new Error('Failed to create calendar event');
            }

            // Ensure meetLink is always a string
            const meetLink = response.data.hangoutLink || response.data.htmlLink;

            if (!meetLink) {
                throw new Error('Failed to generate meeting link');
            }

            return {
                id: eventId,
                meetLink, // Now guaranteed to be a string
                startTime: startDateTime,
                endTime: endDateTime,
                summary,
            };
        } catch (error: unknown) {
            console.error('Error creating meeting:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create meeting';
            throw new Error(errorMessage);
        }
    }

    async cancelMeeting(eventId: string): Promise<void> {
        try {
            await this.calendar.events.delete({
                calendarId: process.env.GOOGLE_CALENDAR_ID || '',
                eventId: eventId,
                sendUpdates: 'all',
            });
        } catch (error: unknown) {
            console.error('Error canceling meeting:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel meeting';
            throw new Error(errorMessage);
        }
    }
}

export const googleMeetService = new GoogleMeetService();