/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    AUTH_SECRET: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    ALLOWED_EMAIL_ADDRESSES: string;
    DND_ACADEMY_V2_BLOB_READ_WRITE_TOKEN: string;
    GOOGLE_CLIENT_EMAIL: string;
    GOOGLE_PRIVATE_KEY: string;
    CRON_SECRET: string;
  }
}
