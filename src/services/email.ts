import { ServerClient, Models } from "postmark";

const { LinkTrackingOptions, TemplatedMessage } = Models;

export type LinkTrackingOption = typeof LinkTrackingOptions[keyof typeof LinkTrackingOptions];

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tag?: string;
  metadata?: Record<string, string>;
  trackOpens?: boolean;
  trackLinks?: LinkTrackingOption;
}

export interface EmailTemplateOptions {
  to: string;
  templateId?: number;
  templateAlias?: string;
  templateModel?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tag?: string;
  trackOpens?: boolean;
  trackLinks?: LinkTrackingOption;
}

export class EmailService {
  private client: ServerClient;
  private defaultFrom: string;

  constructor(apiToken: string, defaultFrom: string) {
    this.client = new ServerClient(apiToken);
    this.defaultFrom = defaultFrom;
  }

  /**
   * Send a simple email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.client.sendEmail({
        From: options.from || this.defaultFrom,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody,
        ReplyTo: options.replyTo,
        Cc: options.cc?.join(", "),
        Bcc: options.bcc?.join(", "),
        Tag: options.tag,
        Metadata: options.metadata,
        TrackOpens: options.trackOpens ?? true,
        TrackLinks: options.trackLinks ?? LinkTrackingOptions.HtmlAndText,
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send an email using a Postmark template
   */
  async sendEmailWithTemplate(options: EmailTemplateOptions): Promise<void> {
    try {
      if (!options.templateId && !options.templateAlias) {
        throw new Error("Either templateId or templateAlias must be provided");
      }

      const templateMessage = new TemplatedMessage(
        options.from || this.defaultFrom,
        options.templateId || options.templateAlias || 0,
        options.templateModel || {},
        options.to,
        options.cc?.join(", "),
        options.bcc?.join(", "),
        options.replyTo,
        options.tag,
        options.trackOpens ?? true,
        options.trackLinks ?? LinkTrackingOptions.HtmlAndText
      );

      await this.client.sendEmailWithTemplate(templateMessage);
    } catch (error) {
      throw new Error(`Failed to send email with template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send email to multiple recipients
   */
  async sendBulkEmail(options: Omit<EmailOptions, "to"> & { recipients: Array<{ email: string; metadata?: Record<string, string> }> }): Promise<void> {
    try {
      const messages = options.recipients.map((recipient) => ({
        From: options.from || this.defaultFrom,
        To: recipient.email,
        Subject: options.subject,
        HtmlBody: options.htmlBody,
        TextBody: options.textBody,
        ReplyTo: options.replyTo,
        Tag: options.tag,
        Metadata: { ...options.metadata, ...recipient.metadata },
        TrackOpens: options.trackOpens ?? true,
        TrackLinks: options.trackLinks ?? LinkTrackingOptions.HtmlAndText,
      }));

      await this.client.sendEmailBatch(messages);
    } catch (error) {
      throw new Error(`Failed to send bulk email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
