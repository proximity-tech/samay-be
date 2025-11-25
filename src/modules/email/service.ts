import * as postmark from "postmark";

const client = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_TOKEN || "POSTMARK_API_TEST"
);

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (
    !process.env.POSTMARK_SERVER_TOKEN ||
    process.env.POSTMARK_SERVER_TOKEN === "POSTMARK_API_TEST"
  ) {
    console.log("Mock Email Sent (Postmark):");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", html);
    return { MessageID: "mock-id", ErrorCode: 0, Message: "OK" };
  }

  try {
    const result = await client.sendEmail({
      From: process.env.POSTMARK_FROM_EMAIL || "admin@samay.com",
      To: to,
      Subject: subject,
      HtmlBody: html,
    });
    console.log("Message sent: %s", result.MessageID);
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (
  to: string,
  userId: string,
  token: string
) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?userId=${userId}&token=${token}`;
  const subject = "Verify your email address";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Samay!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
};
