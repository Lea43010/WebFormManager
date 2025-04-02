declare module 'deepai' {
  interface DeepAI {
    setApiKey(apiKey: string): void;
    
    callStandardApi(
      endpoint: string,
      options: {
        image?: any;
        text?: string;
        [key: string]: any;
      }
    ): Promise<{
      id: string;
      output: any;
    }>;
  }
  
  const deepai: DeepAI;
  export default deepai;
}