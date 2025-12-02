import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string[];
    subject: string;
    html: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. Email not sent.");
        return;
    }

    try {
        // Send in batches if too many recipients (Resend limit is usually high, but good practice)
        // For now, we send to all at once (bcc recommended for privacy if not individual)
        // Or loop through them.
        // Resend supports sending to multiple recipients in 'to' or 'bcc'.
        // Using 'bcc' is better to hide emails from each other.

        const data = await resend.emails.send({
            from: 'Applimescla <onboarding@resend.dev>', // Default testing domain. User should update this later.
            to: ['delivered@resend.dev'], // For testing, only this works until domain verified.
            bcc: to, // Real recipients in BCC
            subject: subject,
            html: html,
        });

        console.log("Email sent successfully", data);
        return data;
    } catch (error) {
        console.error("Failed to send email", error);
        throw error;
    }
}
