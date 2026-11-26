'use client';

import { usePathname } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import type { PublicRecruitment } from '@/lib/cms/recruitment-contract';
import { recruitmentDisplay } from '@/lib/cms/recruitment-display';

type State =
  | { kind: 'unavailable' }
  | { kind: 'legacy' }
  | {
      kind: 'configured';
      settings: PublicRecruitment;
      display: ReturnType<typeof recruitmentDisplay>;
    };

const Context = createContext<State>({ kind: 'legacy' });
export const useRecruitment = () => useContext(Context);
const MAX_TIMER = 2 ** 31 - 1;

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const admin = pathname === '/admin';
  const [settings, setSettings] = useState<PublicRecruitment | null>();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (admin) return;
    const controller = new AbortController();
    let loading = false;
    const refresh = async () => {
      if (document.visibilityState === 'hidden' || loading) return;
      loading = true;
      try {
        const response = await fetch('/api/recruitment', { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Recruitment unavailable');
        const result: { settings: PublicRecruitment | null } = await response.json();
        if (!controller.signal.aborted) {
          setSettings(result.settings);
          setNow(Date.now());
        }
      } catch {
        if (!controller.signal.aborted) setSettings(undefined);
      } finally {
        loading = false;
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [admin]);

  useEffect(() => {
    if (admin || !settings) return;
    const dates = [settings.startsAt, settings.endsAt, settings.announcement?.startsAt, settings.announcement?.endsAt];
    const next = Math.min(...dates.flatMap((date) => (date && Date.parse(date) > now ? [Date.parse(date)] : [])));
    if (!Number.isFinite(next)) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(Math.max(0, next - Date.now()), MAX_TIMER));
    return () => window.clearTimeout(timer);
  }, [admin, now, settings]);

  const state: State =
    admin || settings === undefined
      ? { kind: 'unavailable' }
      : settings === null
        ? { kind: 'legacy' }
        : { kind: 'configured', settings, display: recruitmentDisplay(settings, now) };
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
