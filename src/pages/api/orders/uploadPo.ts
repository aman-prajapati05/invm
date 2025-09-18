import type { NextApiRequest, NextApiResponse } from 'next';
// import type { IncomingForm } from 'formidable';
import formidable, { File as FormidableFile, Files as FormidableFiles } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import { requirePermission } from '@/lib/middleware/authMiddleware';
import axios from 'axios';

export const config = {
    api: {
        bodyParser: false, // Required for formidable
    },
};

type UploadResponse = {
    message: string;
    data?: any;
    error?: any;
};

type ParsedFiles = {
    files: FormidableFile[]; // always an array for easier handling
};

function parseForm(req: NextApiRequest): Promise<ParsedFiles> {
    console.log('🔍 Starting form parsing...');
    const form = formidable({ keepExtensions: true });

    return new Promise((resolve, reject) => {
        form.parse(req, (err: any, _fields: any, files: FormidableFiles) => {
            if (err) {
                console.error('❌ Form parsing error:', err);
                return reject(err);
            }

            console.log('📋 Raw files object:', Object.keys(files));
            const fileList = files.files;
            console.log('📁 File list type:', typeof fileList, 'Is array:', Array.isArray(fileList));

            const filesArray = Array.isArray(fileList) ? fileList : fileList ? [fileList] : [];
            console.log('✅ Files array created with length:', filesArray.length);

            resolve({ files: filesArray });
        });
    });
}

export default requirePermission('orders')(async (req: NextApiRequest, res: NextApiResponse<UploadResponse>) => {
    console.log('=== PO Upload Request Started ===');
    console.log('Method:', req.method);
    console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
        'user-agent': req.headers['user-agent']
    });

    if (req.method !== 'POST') {
        console.log('❌ Invalid method:', req.method);
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        console.log('📁 Starting file parsing...');
        const { files } = await parseForm(req);
        console.log('✅ Files parsed successfully. Count:', files.length);

        if (files.length === 0) {
            console.log('❌ No files found in request');
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Log file details
        files.forEach((file, index) => {
            console.log(`File ${index + 1}:`, {
                name: file.originalFilename,
                size: file.size,
                type: file.mimetype,
                path: file.filepath
            });
        });

        // Log file details
        files.forEach((file, index) => {
            console.log(`File ${index + 1}:`, {
                name: file.originalFilename,
                size: file.size,
                type: file.mimetype,
                path: file.filepath
            });
        });

        console.log('📦 Creating FormData for Python service...');
        const formData = new FormData();

        for (const file of files) {
            console.log(`📎 Adding file to FormData: ${file.originalFilename}`);
            formData.append('files', fs.createReadStream(file.filepath), file.originalFilename ?? 'file.pdf');
        }

        console.log('🌐 Preparing request to Python service...');
        console.log('Python Service URL:', process.env.PYTHON_SERVICE_URL);
        console.log('API Key present:', !!process.env.PYTHON_API_KEY);

        // const pythonResponse = await fetch(process.env.PYTHON_SERVICE_URL!, {
        //   method: 'POST',
        //   headers: {
        //     'x-api-key': process.env.PYTHON_API_KEY!,
        //     ...formData.getHeaders(),
        //   },
        //   body: formData as any,
        // });

        const pythonResponse = await axios.post(
            process.env.PYTHON_SERVICE_URL!,
            formData,
            {
                headers: {
                    'x-api-key': process.env.PYTHON_API_KEY!,
                    ...formData.getHeaders(),
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        console.log('📡 Python service response received:');
        console.log('Status:', pythonResponse.status);
        console.log('Status Text:', pythonResponse.statusText);
        console.log('Headers:', pythonResponse.headers);

        const result = pythonResponse.data;
        console.log('📋 Python service response data:', JSON.stringify(result, null, 2));

        if (pythonResponse.status !== 200) {
            console.log('❌ Python service returned error:');
            console.log('Status:', pythonResponse.status);
            console.log('Error data:', result);
            return res.status(pythonResponse.status).json({
                message: 'Python service failed',
                error: result,
            });
        }

        console.log('✅ Upload completed successfully');
        console.log('=== PO Upload Request Completed ===');
        return res.status(200).json({
            message: 'File(s) processed successfully',
            data: result,
        });
    } catch (error: any) {
        console.error('💥 Upload failed with error:');
        console.error('Error type:', error?.constructor?.name);
        console.error('Error message:', error?.message);
        console.error('Full error:', error);
        console.log('=== PO Upload Request Failed ===');
        return res.status(500).json({
            message: 'Upload failed',
            error,
        });
    }
});
