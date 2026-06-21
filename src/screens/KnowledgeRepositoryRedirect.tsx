import { useEffect } from 'react';

export function KnowledgeRepositoryRedirect({ navigation }: any) {
  useEffect(() => { navigation.replace('Subjects', { tab: 'notes' }); }, []);
  return null;
}
