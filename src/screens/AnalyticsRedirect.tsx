import { useEffect } from 'react';

export function AnalyticsRedirect({ navigation }: any) {
  useEffect(() => { navigation.replace('Progress'); }, []);
  return null;
}
