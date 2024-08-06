import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const {
  handlers, signIn, signOut, auth,
} = NextAuth({
  providers: [Google({
    clientId: process.env.AUTH_GOOGLE_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
    },
  })],
  trustHost: true,
  pages: {
    signIn: '/login',
  },
});
