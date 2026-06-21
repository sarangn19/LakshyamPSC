import { useEffect } from 'react';

export function GoalTrackerRedirect({ navigation }: any) {
  useEffect(() => { navigation.replace('Achievements'); }, []);
  return null;
}
