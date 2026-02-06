import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Explicitly load .env from current directory
const envPath = path.resolve(process.cwd(), '.env');
console.log('Current directory:', process.cwd());
console.log('Looking for .env at:', envPath);
console.log('.env file exists?', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log('.env file size:', fs.statSync(envPath).size, 'bytes');
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        console.error('Error loading .env:', result.error);
    } else {
        console.log('✓ .env loaded successfully');
        console.log('Parsed keys:', Object.keys(result.parsed || {}).join(', '));
    }
} else {
    console.error('✗ .env file not found!');
}
console.log('');

async function testS3Connection() {
    console.log('Testing DigitalOcean Spaces connection...\n');

    // Check environment variables
    console.log('Environment Variables:');
    console.log('S3_REGION:', process.env.S3_REGION);
    console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT);
    console.log('S3_BUCKET:', process.env.S3_BUCKET);
    console.log('S3_PUBLIC_BASE_URL:', process.env.S3_PUBLIC_BASE_URL);
    console.log('S3_ACCESS_KEY_ID:', process.env.S3_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing');
    console.log('S3_SECRET_ACCESS_KEY:', process.env.S3_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing');
    console.log('S3_FORCE_PATH_STYLE:', process.env.S3_FORCE_PATH_STYLE);
    console.log('S3_DISABLE_ACL:', process.env.S3_DISABLE_ACL);
    console.log('');

    const s3Client = new S3Client({
        region: process.env.S3_REGION || 'sgp1',
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID!,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });

    // Test 1: List buckets (verify credentials)
    try {
        console.log('Test 1: Listing buckets...');
        const listResult = await s3Client.send(new ListBucketsCommand({}));
        console.log('✓ Credentials valid');
        console.log('  Available buckets:', listResult.Buckets?.map(b => b.Name).join(', '));
        console.log('');
    } catch (err) {
        const error = err as Error;
        console.error('✗ Failed to list buckets:', error.message);
        console.log('');
    }

    // Test 2: Upload a test file WITHOUT ACL
    try {
        console.log('Test 2: Uploading test file (without ACL)...');
        const testKey = `test/${Date.now()}.txt`;
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: testKey,
            Body: Buffer.from('test'),
            ContentType: 'text/plain',
            // NO ACL specified
        }));
        console.log('✓ Upload successful (without ACL)');
        console.log('  Key:', testKey);
        console.log('');
    } catch (err) {
        const error = err as Error;
        console.error('✗ Upload failed (without ACL):', error.message);
        console.log('');
    }

    // Test 3: Upload a test file WITH ACL
    try {
        console.log('Test 3: Uploading test file (with public-read ACL)...');
        const testKey = `test/${Date.now()}_acl.txt`;
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: testKey,
            Body: Buffer.from('test'),
            ContentType: 'text/plain',
            ACL: 'public-read',
        }));
        console.log('✓ Upload successful (with ACL)');
        console.log('  Key:', testKey);
        console.log('');
    } catch (err) {
        const error = err as Error;
        console.error('✗ Upload failed (with ACL):', error.message);
        console.log('  This likely means ACLs are disabled on your Space');
        console.log('');
    }
}

testS3Connection().catch(console.error);