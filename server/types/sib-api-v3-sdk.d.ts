declare module 'sib-api-v3-sdk' {
  export class ApiClient {
    static instance: any;
    authentications: {
      'api-key': {
        apiKey: string;
      };
    };
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(email: SendSmtpEmail): Promise<any>;
  }

  export class SendSmtpEmail {
    subject: string;
    htmlContent: string;
    textContent: string;
    sender: {
      name: string;
      email: string;
    };
    to: Array<{
      email: string;
      name?: string;
    }>;
  }
}