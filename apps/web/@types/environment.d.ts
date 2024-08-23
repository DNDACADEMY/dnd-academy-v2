/* eslint-disable @typescript-eslint/no-unused-vars */
namespace NodeJS {
  interface ProcessEnv extends NodeJS.ProcessEnv {
    NEXT_PUBLIC_S3_HOST: string;
    NEXT_PUBLIC_ORIGIN: string;
    NEXT_PUBLIC_BLOG_HOST: string;
    NEXT_PUBLIC_VERCEL_BLOB_HOST: string;
    NEXT_PUBLIC_GA_MEASUREMENT_ID: string;
    NEXT_PUBLIC_CHANNEL_IO_PLUGIN_KEY: string;
    REVALIDATION_TOKEN: string;
    ADMIN_ORIGIN: string;
  }
}
