import "server-only";

import { SITE_DOMAIN, SITE_URL, ADMIN_EMAIL, SITE_NAME } from "@/constants";
import { resetPasswordText } from "@/react-email/reset-password";
import { verifyEmailText } from "@/react-email/verify-email";
import { applicantInvitationText, applicantAddedNotificationText } from "@/react-email/applicant-invitation";
import { agencyTeamAccessText } from "@/react-email/agency-team-access";
import isProd from "./is-prod";
import { logger } from "@/infra/logger";

interface SendEmailOptions {
  to: string[];
  subject: string;
  text: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

async function sendEmail({
  to,
  subject,
  text,
  from,
  replyTo: originalReplyTo,
  tags,
}: SendEmailOptions) {
  if (!isProd) {
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set. Configure it as a Cloudflare Worker secret.");
  }

  const replyTo = originalReplyTo ?? process.env.EMAIL_REPLY_TO;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    } as const,
    body: JSON.stringify({
      from: from ?? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
      tags,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send email via Resend: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function sendPasswordResetEmail({
  email,
  resetToken,
  username
}: {
  email: string;
  resetToken: string;
  username: string;
}) {
  const resetUrl = `${SITE_URL}/reset-password?token=${resetToken}`;

  if (!isProd) {
    logger.warn('Password reset url: ', { resetUrl })

    return
  }

  const text = resetPasswordText({ resetLink: resetUrl, username });

  await sendEmail({
    to: [email],
    subject: `Reset your password for ${SITE_DOMAIN}`,
    text,
    tags: [{ name: "type", value: "password-reset" }],
  });
}

export async function sendVerificationEmail({
  email,
  verificationToken,
  username
}: {
  email: string;
  verificationToken: string;
  username: string;
}) {
  const verificationUrl = `${SITE_URL}/verify-email?token=${verificationToken}`;

  if (!isProd) {
    logger.warn('Verification url: ', { verificationUrl })

    return
  }

  const text = verifyEmailText({ verificationLink: verificationUrl, username });

  await sendEmail({
    to: [email],
    subject: `Verify your email for ${SITE_DOMAIN}`,
    text,
    tags: [{ name: "type", value: "email-verification" }],
  });
}

export async function sendNewUserSignupNotificationEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  if (!isProd) {
    logger.warn("New user signup notification skipped in dev", { email, name });
    return;
  }

  const text = `Hi team,

A new user has signed up for ${SITE_NAME}.

Name: ${name}
Email: ${email}

Best,
${SITE_NAME}`;

  await sendEmail({
    to: [ADMIN_EMAIL],
    subject: `New user signup: ${name}`,
    text,
    tags: [{ name: "type", value: "new-user-signup" }],
  });
}

export async function sendApplicantInvitationEmail({
  email,
  inviterName,
  applicationName,
}: {
  email: string;
  inviterName: string;
  applicationName: string;
}) {
  if (!isProd) {
    logger.warn("Applicant invitation email (skipped in dev)", { email, inviterName, applicationName });
    return;
  }

  const text = applicantInvitationText({ inviterName, applicationName });

  await sendEmail({
    to: [email],
    subject: `You've been added to a visa application on ${SITE_DOMAIN}`,
    text,
    tags: [{ name: "type", value: "applicant-invitation" }],
  });
}

export async function sendApplicantAddedNotificationEmail({
  email,
  inviterName,
  applicationName,
  applicationId,
}: {
  email: string;
  inviterName: string;
  applicationName: string;
  applicationId: string;
}) {
  if (!isProd) {
    logger.warn("Applicant added notification (skipped in dev)", { email, inviterName, applicationName, applicationId });
    return;
  }

  const text = applicantAddedNotificationText({ inviterName, applicationName, applicationId });

  await sendEmail({
    to: [email],
    subject: `You've been added to a visa application on ${SITE_DOMAIN}`,
    text,
    tags: [{ name: "type", value: "applicant-added-notification" }],
  });
}

export async function sendAgencyTeamAccessEmail({
  email,
  addedByName,
  role,
}: {
  email: string;
  addedByName: string;
  role: string;
}) {
  if (!isProd) {
    logger.warn("Agency team access email skipped in dev", { email, addedByName, role });
    return;
  }

  const text = agencyTeamAccessText({ addedByName, role });

  await sendEmail({
    to: [email],
    subject: `You've been added to the ${SITE_DOMAIN} agency workspace`,
    text,
    tags: [{ name: "type", value: "agency-team-access" }],
  });
}
