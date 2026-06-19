import { useUserStore } from '../store/userStore';
import { translate, type Locale } from './index';

export function useTranslation() {
  const locale = useUserStore((s) => s.locale);
  return {
    t: (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    locale,
    setLocale: (l: Locale) => useUserStore.getState().setLocale(l),
  };
}
