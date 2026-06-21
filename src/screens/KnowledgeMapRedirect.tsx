import { useEffect } from 'react';

export function KnowledgeMapRedirect({ navigation }: any) {
  useEffect(() => { navigation.replace('Subjects', { tab: 'mastery' }); }, []);
  return null;
}
