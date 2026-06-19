export type NodeLevel = 'subject' | 'topic' | 'subtopic';

export interface KnowledgeNode {
  id: string;
  name: string;
  level: NodeLevel;
  parentId: string | null;
}

const TREE: KnowledgeNode[] = [
  // ─── SUBJECTS ───
  { id: 'subj_history', name: 'Kerala History', level: 'subject', parentId: null },
  { id: 'subj_renaissance', name: 'Renaissance', level: 'subject', parentId: null },
  { id: 'subj_constitution', name: 'Constitution', level: 'subject', parentId: null },
  { id: 'subj_geography', name: 'Geography', level: 'subject', parentId: null },
  { id: 'subj_science', name: 'Science', level: 'subject', parentId: null },
  { id: 'subj_current', name: 'Current Affairs', level: 'subject', parentId: null },
  { id: 'subj_aptitude', name: 'Quantitative Aptitude', level: 'subject', parentId: null },
  { id: 'subj_mental', name: 'Mental Ability', level: 'subject', parentId: null },
  { id: 'subj_malayalam', name: 'Malayalam', level: 'subject', parentId: null },

  // ─── KERALA HISTORY ───
  { id: 'topic_history_ancient', name: 'Ancient Kerala', level: 'topic', parentId: 'subj_history' },
  { id: 'topic_history_medieval', name: 'Medieval Kerala', level: 'topic', parentId: 'subj_history' },
  { id: 'topic_history_modern', name: 'Modern Kerala', level: 'topic', parentId: 'subj_history' },

  // Ancient Kerala subtopics
  { id: 'subt_ancient_prehistoric', name: 'Pre-historic Kerala', level: 'subtopic', parentId: 'topic_history_ancient' },
  { id: 'subt_ancient_sangam', name: 'Sangam Period', level: 'subtopic', parentId: 'topic_history_ancient' },
  { id: 'subt_ancient_chera', name: 'Chera Dynasty', level: 'subtopic', parentId: 'topic_history_ancient' },

  // Medieval Kerala subtopics
  { id: 'subt_medieval_venad', name: 'Venad Kingdom', level: 'subtopic', parentId: 'topic_history_medieval' },
  { id: 'subt_medieval_zamorins', name: 'Zamorins of Calicut', level: 'subtopic', parentId: 'topic_history_medieval' },
  { id: 'subt_medieval_kochi', name: 'Kochi Kingdom', level: 'subtopic', parentId: 'topic_history_medieval' },

  // Modern Kerala subtopics
  { id: 'subt_modern_british', name: 'British Rule', level: 'subtopic', parentId: 'topic_history_modern' },
  { id: 'subt_modern_formation', name: 'Formation of Kerala State', level: 'subtopic', parentId: 'topic_history_modern' },

  // ─── RENAISSANCE ───
  { id: 'topic_ren_social', name: 'Social Reform Movements', level: 'topic', parentId: 'subj_renaissance' },
  { id: 'topic_ren_temple', name: 'Temple Entry Movement', level: 'topic', parentId: 'subj_renaissance' },

  // Social Reform Movements subtopics
  { id: 'subt_ren_sndp', name: 'SNDP Yogam', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_nss', name: 'NSS', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_ayyankali', name: 'Ayyankali', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_chattampi', name: 'Chattampi Swamikal', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_sahodaran', name: 'Sahodaran Ayyappan', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_sree_narayana', name: 'Sree Narayana Guru', level: 'subtopic', parentId: 'topic_ren_social' },

  // Temple Entry Movement subtopics
  { id: 'subt_temple_vaikom', name: 'Vaikom Satyagraha', level: 'subtopic', parentId: 'topic_ren_temple' },
  { id: 'subt_temple_proclamation', name: 'Temple Entry Proclamation', level: 'subtopic', parentId: 'topic_ren_temple' },

  // ─── CONSTITUTION ───
  { id: 'topic_const_fr', name: 'Fundamental Rights', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_dpsp', name: 'Directive Principles', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_exec', name: 'Union Executive', level: 'topic', parentId: 'subj_constitution' },

  // Fundamental Rights subtopics
  { id: 'subt_fr_equality', name: 'Right to Equality', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_freedom', name: 'Right to Freedom', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_remedies', name: 'Right to Constitutional Remedies', level: 'subtopic', parentId: 'topic_const_fr' },

  // Directive Principles subtopics
  { id: 'subt_dpsp_socialistic', name: 'Socialistic Principles', level: 'subtopic', parentId: 'topic_const_dpsp' },
  { id: 'subt_dpsp_gandhian', name: 'Gandhian Principles', level: 'subtopic', parentId: 'topic_const_dpsp' },

  // Union Executive subtopics
  { id: 'subt_exec_president', name: 'President', level: 'subtopic', parentId: 'topic_const_exec' },
  { id: 'subt_exec_pm', name: 'Prime Minister', level: 'subtopic', parentId: 'topic_const_exec' },
  { id: 'subt_exec_council', name: 'Council of Ministers', level: 'subtopic', parentId: 'topic_const_exec' },

  // ─── GEOGRAPHY ───
  { id: 'topic_geo_physical', name: 'Physical Geography', level: 'topic', parentId: 'subj_geography' },
  { id: 'topic_geo_kerala', name: 'Kerala Geography', level: 'topic', parentId: 'subj_geography' },

  // Physical Geography subtopics
  { id: 'subt_phys_climate', name: 'Climate', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_rivers', name: 'Rivers', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_soils', name: 'Soil Types', level: 'subtopic', parentId: 'topic_geo_physical' },

  // Kerala Geography subtopics
  { id: 'subt_kerala_districts', name: 'Districts', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_ghats', name: 'Western Ghats', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_backwaters', name: 'Backwaters', level: 'subtopic', parentId: 'topic_geo_kerala' },

  // ─── SCIENCE ───
  { id: 'topic_sci_physics', name: 'Physics', level: 'topic', parentId: 'subj_science' },
  { id: 'topic_sci_chemistry', name: 'Chemistry', level: 'topic', parentId: 'subj_science' },
  { id: 'topic_sci_biology', name: 'Biology', level: 'topic', parentId: 'subj_science' },

  // Physics subtopics
  { id: 'subt_phys_motion', name: 'Motion', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_energy', name: 'Energy', level: 'subtopic', parentId: 'topic_sci_physics' },

  // Chemistry subtopics
  { id: 'subt_chem_periodic', name: 'Periodic Table', level: 'subtopic', parentId: 'topic_sci_chemistry' },
  { id: 'subt_chem_reactions', name: 'Chemical Reactions', level: 'subtopic', parentId: 'topic_sci_chemistry' },

  // Biology subtopics
  { id: 'subt_bio_human', name: 'Human Body', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_ecology', name: 'Ecology', level: 'subtopic', parentId: 'topic_sci_biology' },

  // ─── CURRENT AFFAIRS ───
  { id: 'topic_curr_kerala', name: 'Kerala News', level: 'topic', parentId: 'subj_current' },
  { id: 'topic_curr_national', name: 'National News', level: 'topic', parentId: 'subj_current' },

  // Kerala News subtopics
  { id: 'subt_curr_schemes', name: 'Government Schemes', level: 'subtopic', parentId: 'topic_curr_kerala' },
  { id: 'subt_curr_infra', name: 'Infrastructure', level: 'subtopic', parentId: 'topic_curr_kerala' },

  // National News subtopics
  { id: 'subt_curr_appointments', name: 'Appointments', level: 'subtopic', parentId: 'topic_curr_national' },
  { id: 'subt_curr_awards', name: 'Awards', level: 'subtopic', parentId: 'topic_curr_national' },

  // ─── QUANTITATIVE APTITUDE ───
  { id: 'topic_apt_arithmetic', name: 'Arithmetic', level: 'topic', parentId: 'subj_aptitude' },
  { id: 'topic_apt_data', name: 'Data Interpretation', level: 'topic', parentId: 'subj_aptitude' },

  // Arithmetic subtopics
  { id: 'subt_apt_percentages', name: 'Percentages', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_ratios', name: 'Ratios', level: 'subtopic', parentId: 'topic_apt_arithmetic' },

  // Data Interpretation subtopics
  { id: 'subt_apt_charts', name: 'Charts', level: 'subtopic', parentId: 'topic_apt_data' },
  { id: 'subt_apt_tables', name: 'Tables', level: 'subtopic', parentId: 'topic_apt_data' },

  // ─── MENTAL ABILITY ───
  { id: 'topic_mental_logic', name: 'Logical Reasoning', level: 'topic', parentId: 'subj_mental' },

  // Logical Reasoning subtopics
  { id: 'subt_mental_analogies', name: 'Analogies', level: 'subtopic', parentId: 'topic_mental_logic' },
  { id: 'subt_mental_coding', name: 'Coding-Decoding', level: 'subtopic', parentId: 'topic_mental_logic' },

  // ─── MALAYALAM ───
  { id: 'topic_mal_grammar', name: 'Grammar', level: 'topic', parentId: 'subj_malayalam' },
  { id: 'topic_mal_literature', name: 'Literature', level: 'topic', parentId: 'subj_malayalam' },

  // Grammar subtopics
  { id: 'subt_mal_sandhi', name: 'Sandhi', level: 'subtopic', parentId: 'topic_mal_grammar' },
  { id: 'subt_mal_samasa', name: 'Samasa', level: 'subtopic', parentId: 'topic_mal_grammar' },

  // Literature subtopics
  { id: 'subt_mal_ancient_poets', name: 'Ancient Poets', level: 'subtopic', parentId: 'topic_mal_literature' },
  { id: 'subt_mal_modern', name: 'Modern Literature', level: 'subtopic', parentId: 'topic_mal_literature' },
];

const NODE_MAP = new Map<string, KnowledgeNode>(TREE.map((n) => [n.id, n]));

export function getNode(id: string): KnowledgeNode | undefined {
  return NODE_MAP.get(id);
}

export function getNodeByName(name: string, level?: NodeLevel): KnowledgeNode | undefined {
  return TREE.find((n) => n.name === name && (!level || n.level === level));
}

export function getChildren(parentId: string): KnowledgeNode[] {
  return TREE.filter((n) => n.parentId === parentId);
}

export function getAncestors(nodeId: string): KnowledgeNode[] {
  const result: KnowledgeNode[] = [];
  let current = NODE_MAP.get(nodeId);
  while (current?.parentId) {
    const parent = NODE_MAP.get(current.parentId);
    if (parent) {
      result.unshift(parent);
      current = parent;
    } else break;
  }
  return result;
}

export function getDescendants(nodeId: string): KnowledgeNode[] {
  const result: KnowledgeNode[] = [];
  const children = getChildren(nodeId);
  for (const child of children) {
    result.push(child);
    result.push(...getDescendants(child.id));
  }
  return result;
}

export function getNodePath(nodeId: string): string[] {
  return [...getAncestors(nodeId), NODE_MAP.get(nodeId)!].filter(Boolean).map((n) => n.name);
}

export function getAllNodes(): KnowledgeNode[] {
  return TREE;
}

export function getNodesByLevel(level: NodeLevel): KnowledgeNode[] {
  return TREE.filter((n) => n.level === level);
}

export function getSiblings(nodeId: string): KnowledgeNode[] {
  const node = NODE_MAP.get(nodeId);
  if (!node || !node.parentId) return [];
  return TREE.filter((n) => n.parentId === node.parentId && n.id !== nodeId);
}

export function getParent(nodeId: string): KnowledgeNode | undefined {
  const node = NODE_MAP.get(nodeId);
  if (!node?.parentId) return undefined;
  return NODE_MAP.get(node.parentId);
}
