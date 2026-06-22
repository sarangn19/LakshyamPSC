/** @deprecated Use knowledgeTree.ts instead for subject/topic hierarchy.
 *  topicTaxonomy only covers 9 of 18 subjects and uses non-canonical naming.
 *  Preserved for topicRelations.ts alignment scoring until migrated. */

export interface TaxonomyNode {
  subject: string;
  children: string[];
}

const TAXONOMY: TaxonomyNode[] = [
  { subject: 'Kerala History', children: ['Renaissance'] },
  { subject: 'Renaissance', children: ['Social Reform Movements', 'Temple Entry Movement'] },
  { subject: 'Constitution', children: ['Fundamental Rights', 'Directive Principles', 'Union Executive'] },
  { subject: 'Geography', children: ['Physical Geography', 'Kerala Geography'] },
  { subject: 'Science', children: ['Physics', 'Chemistry', 'Biology'] },
  { subject: 'Current Affairs', children: ['Kerala News', 'National News'] },
  { subject: 'Quantitative Aptitude', children: ['Arithmetic', 'Data Interpretation'] },
  { subject: 'Mental Ability', children: ['Logical Reasoning'] },
  { subject: 'Malayalam', children: ['Grammar', 'Literature'] },
];

function findParent(subject: string): string | null {
  for (const node of TAXONOMY) {
    if (node.children.includes(subject)) {
      return node.subject;
    }
  }
  return null;
}

function hasAncestor(subject: string, ancestor: string): boolean {
  if (subject === ancestor) return true;
  const parent = findParent(subject);
  if (!parent) return false;
  return hasAncestor(parent, ancestor);
}

function isDescendantOf(subject: string, potentialParent: string): boolean {
  const parent = findParent(subject);
  if (!parent) return false;
  if (parent === potentialParent) return true;
  return isDescendantOf(parent, potentialParent);
}

export function isSameTopic(topicA: string, topicB: string): boolean {
  return topicA.toLowerCase() === topicB.toLowerCase();
}

export function isParentTopic(parent: string, child: string): boolean {
  const node = TAXONOMY.find((n) => n.subject === parent);
  if (!node) return false;
  return node.children.includes(child) || isDescendantOf(child, parent);
}

export function isChildTopic(child: string, parent: string): boolean {
  return isParentTopic(parent, child);
}

export function getTopicDistance(
  subjectA: string,
  subjectB: string,
): number {
  if (subjectA === subjectB) return 0;

  if (isParentTopic(subjectA, subjectB)) return 1;
  if (isParentTopic(subjectB, subjectA)) return 1;

  const parentA = findParent(subjectA);
  const parentB = findParent(subjectB);
  if (parentA && parentB && parentA === parentB) return 2;

  if (hasAncestor(subjectA, subjectB)) return 2;
  if (hasAncestor(subjectB, subjectA)) return 2;

  return -1;
}

export function getAlignmentScore(
  questionSubject: string,
  questionTopic: string,
  recommendedSubject: string,
  recommendedTopic?: string,
): number {
  if (!recommendedSubject) return 1.0;

  if (recommendedTopic) {
    if (isSameTopic(questionTopic, recommendedTopic)) return 1.0;
    if (isSameTopic(questionSubject, recommendedSubject)) {
      if (questionTopic === recommendedTopic) return 1.0;
      return 0.7;
    }
    if (isParentTopic(recommendedSubject, questionSubject)) return 0.9;
    if (isParentTopic(questionSubject, recommendedSubject)) return 0.7;
    return 0;
  }

  if (isSameTopic(questionSubject, recommendedSubject)) return 1.0;

  if (isParentTopic(recommendedSubject, questionSubject)) return 0.9;

  if (isParentTopic(questionSubject, recommendedSubject)) return 0.7;

  const distance = getTopicDistance(questionSubject, recommendedSubject);
  if (distance === 2) return 0.5;
  if (distance > 0) return 0.5;

  return 0;
}

export function getMatchLabel(
  questionSubject: string,
  questionTopic: string,
  recommendedSubject: string,
  recommendedTopic?: string,
): string {
  if (!recommendedSubject) return 'no_recommendation';
  if (recommendedTopic && isSameTopic(questionTopic, recommendedTopic)) return 'exact_topic';
  if (isSameTopic(questionSubject, recommendedSubject)) return 'same_subject';
  if (isParentTopic(recommendedSubject, questionSubject)) return 'child_domain';
  if (isParentTopic(questionSubject, recommendedSubject)) return 'parent_domain';
  if (getTopicDistance(questionSubject, recommendedSubject) > 0) return 'related_domain';
  return 'unrelated';
}
