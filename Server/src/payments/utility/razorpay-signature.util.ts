import * as crypto from 'crypto';

export function verifyRazorpaySignature(rawBody: Buffer, signature: string, secret: string,): boolean {
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return expectedSignature === signature;
}