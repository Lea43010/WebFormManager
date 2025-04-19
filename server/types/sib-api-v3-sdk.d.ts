declare module 'sib-api-v3-sdk' {
  export class ApiClient {
    static instance: any;
    authentications: {
      'api-key': {
        apiKey: string;
      };
    };
  }

  export enum TransactionalEmailsApiApiKeys {
    apiKey = 'api-key'
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(email: SendSmtpEmail): Promise<any>;
    setApiKey(name: string, value: string): void;
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