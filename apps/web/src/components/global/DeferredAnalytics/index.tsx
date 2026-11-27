'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const GoogleAnalytics = dynamic(() => import('@next/third-parties/google').then((mod) => mod.GoogleAnalytics), {
  ssr: false,
});

const VercelAnalytics = dynamic(() => import('@vercel/analytics/react').then((mod) => mod.Analytics), { ssr: false });

const VercelSpeedInsights = dynamic(() => import('@vercel/speed-insights/react').then((mod) => mod.SpeedInsights), {
  ssr: false,
});

function DeferredAnalytics() {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/submit-content/')) return null;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      <VercelAnalytics />
      <VercelSpeedInsights />
      {Boolean(gaId) && <GoogleAnalytics gaId={gaId} />}
    </>
  );
}

export default DeferredAnalytics;
