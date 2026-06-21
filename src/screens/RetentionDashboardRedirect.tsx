import { useEffect } from 'react';

export function RetentionDashboardRedirect({ navigation }: any) {
  useEffect(() => { navigation.replace('Progress'); }, []);
  return null;
}
