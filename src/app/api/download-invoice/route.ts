import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get('file');

        if (!fileName) {
            return NextResponse.json({ error: 'File name required' }, { status: 400 });
        }

        // Security: Validate file name to prevent directory traversal
        if (!/^invoice_\d+\.pdf$/.test(fileName)) {
            return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
        }

        const filePath = join(process.cwd(), 'temp', fileName);

        if (!existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read the PDF file
        const pdfBuffer = readFileSync(filePath);

        // Return as downloadable PDF
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}