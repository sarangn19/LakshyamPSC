export type NodeLevel = 'subject' | 'topic' | 'subtopic';

export interface KnowledgeNode {
  id: string;
  name: string;
  level: NodeLevel;
  parentId: string | null;
  prerequisites?: string[];
}

/**
 * Canonical subject names (18 total). Maps from syllabus.ts.
 * All subject-level nodes use these exact names.
 */
export const CANONICAL_SUBJECTS = [
  'Kerala History', 'Renaissance', 'Constitution', 'Geography',
  'Current Affairs', 'Science', 'Quantitative Aptitude', 'Mental Ability',
  'Malayalam', 'Indian History & National Movement', 'World History',
  'Civics & Public Administration', 'Indian Economy', 'Kerala Economy',
  'Information Technology & Cyber Laws', 'English',
  'Arts, Sports & Culture', 'Special Acts & Social Welfare',
];

/** Map from non-canonical subject names to canonical */
export const SUBJECT_ALIASES: Record<string, string> = {
  'Polity': 'Constitution',
  'Indian History': 'Indian History & National Movement',
  'Social Science': 'Civics & Public Administration',
  'General Science': 'Science',
  'Indian Constitution': 'Constitution',
  'Mathematics': 'Quantitative Aptitude',
  'General Knowledge': 'Current Affairs',
  'GK': 'Current Affairs',
};

/** Map from non-canonical topic names to canonical subject::topic */
export const TOPIC_ALIASES: Record<string, string> = {
  'Constitution': 'Constitution::Constitutional Framework',
  'Directive Principles': 'Constitution::Directive Principles & Fundamental Duties',
  'Parliament': 'Constitution::Union Legislature',
  'President': 'Constitution::Union Executive',
  'Modern India': 'Indian History & National Movement::British Rule & Early Struggles',
  'Freedom Movement': 'Indian History & National Movement::Indian National Movement',
  'Continents and Oceans': 'Geography::Physical Geography (World)',
  'World Geography': 'Geography::Physical Geography (World)',
  'Geographical Features': 'Geography::Physical Geography (World)',
  'Physical Geography': 'Geography::Physical Geography (World)',
  'Grammar': 'Malayalam::Grammar (വ്യാകരണം)',
  'Literature': 'Malayalam::Literature (സാഹിത്യം)',
  'Logical Reasoning': 'Mental Ability::Analogy & Classification',
};

export function toCanonicalSubject(name: string): string {
  return SUBJECT_ALIASES[name] || name;
}

export function toCanonicalTopic(subject: string, topic: string): [string, string] {
  const key = TOPIC_ALIASES[topic];
  if (key) {
    const [canonSubject, canonTopic] = key.split('::');
    return [canonSubject, canonTopic];
  }
  return [toCanonicalSubject(subject), topic];
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
  { id: 'subj_indian_history', name: 'Indian History & National Movement', level: 'subject', parentId: null },
  { id: 'subj_world_history', name: 'World History', level: 'subject', parentId: null },
  { id: 'subj_civics', name: 'Civics & Public Administration', level: 'subject', parentId: null },
  { id: 'subj_indian_economy', name: 'Indian Economy', level: 'subject', parentId: null },
  { id: 'subj_kerala_economy', name: 'Kerala Economy', level: 'subject', parentId: null },
  { id: 'subj_it', name: 'Information Technology & Cyber Laws', level: 'subject', parentId: null },
  { id: 'subj_english', name: 'English', level: 'subject', parentId: null },
  { id: 'subj_arts', name: 'Arts, Sports & Culture', level: 'subject', parentId: null },
  { id: 'subj_special_acts', name: 'Special Acts & Social Welfare', level: 'subject', parentId: null },

  // ═══════════════════════════════════════════════
  // KERALA HISTORY
  // ═══════════════════════════════════════════════
  { id: 'topic_history_ancient', name: 'Ancient Kerala', level: 'topic', parentId: 'subj_history' },
  { id: 'topic_history_medieval', name: 'Medieval Kerala', level: 'topic', parentId: 'subj_history', prerequisites: ['topic_history_ancient'] },
  { id: 'topic_history_modern', name: 'Modern Kerala', level: 'topic', parentId: 'subj_history', prerequisites: ['topic_history_medieval'] },
  { id: 'topic_history_cultural', name: 'Cultural History', level: 'topic', parentId: 'subj_history' },
  { id: 'topic_history_freedom', name: 'Freedom Struggle', level: 'topic', parentId: 'subj_history', prerequisites: ['topic_history_modern'] },

  // Ancient Kerala
  { id: 'subt_ancient_prehistoric', name: 'Pre-historic Kerala', level: 'subtopic', parentId: 'topic_history_ancient' },
  { id: 'subt_ancient_sangam', name: 'Sangam Period', level: 'subtopic', parentId: 'topic_history_ancient' },
  { id: 'subt_ancient_chera', name: 'Chera Dynasty', level: 'subtopic', parentId: 'topic_history_ancient' },
  { id: 'subt_ancient_roman', name: 'Roman Trade Links', level: 'subtopic', parentId: 'topic_history_ancient' },

  // Medieval Kerala
  { id: 'subt_medieval_venad', name: 'Venad Kingdom', level: 'subtopic', parentId: 'topic_history_medieval' },
  { id: 'subt_medieval_zamorins', name: 'Zamorins of Calicut', level: 'subtopic', parentId: 'topic_history_medieval' },
  { id: 'subt_medieval_kochi', name: 'Kochi Kingdom', level: 'subtopic', parentId: 'topic_history_medieval' },
  { id: 'subt_medieval_portuguese', name: 'Portuguese Influence', level: 'subtopic', parentId: 'topic_history_medieval' },
  { id: 'subt_medieval_dutch', name: 'Dutch Influence', level: 'subtopic', parentId: 'topic_history_medieval' },

  // Modern Kerala
  { id: 'subt_modern_british', name: 'British Rule', level: 'subtopic', parentId: 'topic_history_modern' },
  { id: 'subt_modern_formation', name: 'Formation of Kerala State', level: 'subtopic', parentId: 'topic_history_modern' },
  { id: 'subt_modern_malabar', name: 'Malabar Rebellion', level: 'subtopic', parentId: 'topic_history_modern' },
  { id: 'subt_modern_travancore', name: 'Travancore Kingdom', level: 'subtopic', parentId: 'topic_history_modern' },
  { id: 'subt_modern_cochin', name: 'Cochin Kingdom', level: 'subtopic', parentId: 'topic_history_modern' },

  // Cultural History
  { id: 'subt_cultural_art', name: 'Art Forms', level: 'subtopic', parentId: 'topic_history_cultural' },
  { id: 'subt_cultural_architecture', name: 'Architecture', level: 'subtopic', parentId: 'topic_history_cultural' },
  { id: 'subt_cultural_folk', name: 'Folk Culture', level: 'subtopic', parentId: 'topic_history_cultural' },
  { id: 'subt_cultural_festivals', name: 'Festivals', level: 'subtopic', parentId: 'topic_history_cultural' },

  // Freedom Struggle
  { id: 'subt_freedom_salt', name: 'Salt Satyagraha in Kerala', level: 'subtopic', parentId: 'topic_history_freedom' },
  { id: 'subt_freedom_civil', name: 'Civil Disobedience', level: 'subtopic', parentId: 'topic_history_freedom' },
  { id: 'subt_freedom_quit', name: 'Quit India Movement', level: 'subtopic', parentId: 'topic_history_freedom' },

  // ═══════════════════════════════════════════════
  // RENAISSANCE
  // ═══════════════════════════════════════════════
  { id: 'topic_ren_social', name: 'Social Reform Movements', level: 'topic', parentId: 'subj_renaissance' },
  { id: 'topic_ren_temple', name: 'Temple Entry Movement', level: 'topic', parentId: 'subj_renaissance', prerequisites: ['topic_ren_social'] },
  { id: 'topic_ren_literary', name: 'Literary Renaissance', level: 'topic', parentId: 'subj_renaissance', prerequisites: ['topic_ren_social'] },
  { id: 'topic_ren_women', name: 'Women Empowerment', level: 'topic', parentId: 'subj_renaissance', prerequisites: ['topic_ren_social'] },

  // Social Reform Movements
  { id: 'subt_ren_sndp', name: 'SNDP Yogam', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_nss', name: 'NSS', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_ayyankali', name: 'Ayyankali', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_chattampi', name: 'Chattampi Swamikal', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_sahodaran', name: 'Sahodaran Ayyappan', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_sree_narayana', name: 'Sree Narayana Guru', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_vagbhadananda', name: 'Vagbhadananda', level: 'subtopic', parentId: 'topic_ren_social' },
  { id: 'subt_ren_brahmananda', name: 'Brahmananda Sivayogi', level: 'subtopic', parentId: 'topic_ren_social' },

  // Temple Entry Movement
  { id: 'subt_temple_vaikom', name: 'Vaikom Satyagraha', level: 'subtopic', parentId: 'topic_ren_temple' },
  { id: 'subt_temple_proclamation', name: 'Temple Entry Proclamation', level: 'subtopic', parentId: 'topic_ren_temple' },
  { id: 'subt_temple_guruvayur', name: 'Guruvayur Satyagraha', level: 'subtopic', parentId: 'topic_ren_temple' },

  // Literary Renaissance
  { id: 'subt_literary_venmani', name: 'Venmani School', level: 'subtopic', parentId: 'topic_ren_literary' },
  { id: 'subt_literary_malayali', name: 'Malayali Memorial', level: 'subtopic', parentId: 'topic_ren_literary' },

  // Women Empowerment
  { id: 'subt_women_education', name: 'Women Education', level: 'subtopic', parentId: 'topic_ren_women' },
  { id: 'subt_women_reformers', name: 'Female Reformers', level: 'subtopic', parentId: 'topic_ren_women' },

  // ═══════════════════════════════════════════════
  // CONSTITUTION
  // ═══════════════════════════════════════════════
  { id: 'topic_const_fr', name: 'Fundamental Rights', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_dpsp', name: 'Directive Principles', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_duties', name: 'Fundamental Duties', level: 'topic', parentId: 'subj_constitution', prerequisites: ['topic_const_fr'] },
  { id: 'topic_const_exec', name: 'Union Executive', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_legislature', name: 'Union Legislature', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_judiciary', name: 'Judiciary', level: 'topic', parentId: 'subj_constitution' },
  { id: 'topic_const_state_exec', name: 'State Executive', level: 'topic', parentId: 'subj_constitution', prerequisites: ['topic_const_exec'] },
  { id: 'topic_const_state_leg', name: 'State Legislature', level: 'topic', parentId: 'subj_constitution', prerequisites: ['topic_const_legislature'] },
  { id: 'topic_const_federal', name: 'Federal System', level: 'topic', parentId: 'subj_constitution', prerequisites: ['topic_const_exec', 'topic_const_judiciary'] },
  { id: 'topic_const_lsg', name: 'Local Self Government', level: 'topic', parentId: 'subj_constitution', prerequisites: ['topic_const_federal'] },
  { id: 'topic_const_amendments', name: 'Constitutional Amendments', level: 'topic', parentId: 'subj_constitution', prerequisites: ['topic_const_federal', 'topic_const_legislature'] },
  { id: 'topic_const_bodies', name: 'Constitutional Bodies', level: 'topic', parentId: 'subj_constitution' },

  // Fundamental Rights
  { id: 'subt_fr_equality', name: 'Right to Equality', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_freedom', name: 'Right to Freedom', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_exploitation', name: 'Right against Exploitation', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_religion', name: 'Right to Freedom of Religion', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_culture', name: 'Cultural & Educational Rights', level: 'subtopic', parentId: 'topic_const_fr' },
  { id: 'subt_fr_remedies', name: 'Right to Constitutional Remedies', level: 'subtopic', parentId: 'topic_const_fr' },

  // Directive Principles
  { id: 'subt_dpsp_socialistic', name: 'Socialistic Principles', level: 'subtopic', parentId: 'topic_const_dpsp' },
  { id: 'subt_dpsp_gandhian', name: 'Gandhian Principles', level: 'subtopic', parentId: 'topic_const_dpsp' },
  { id: 'subt_dpsp_liberal', name: 'Liberal Intellectual Principles', level: 'subtopic', parentId: 'topic_const_dpsp' },

  // Fundamental Duties
  { id: 'subt_duties_list', name: 'List of Duties', level: 'subtopic', parentId: 'topic_const_duties' },
  { id: 'subt_duties_significance', name: 'Significance', level: 'subtopic', parentId: 'topic_const_duties' },

  // Union Executive
  { id: 'subt_exec_president', name: 'President', level: 'subtopic', parentId: 'topic_const_exec' },
  { id: 'subt_exec_vp', name: 'Vice President', level: 'subtopic', parentId: 'topic_const_exec' },
  { id: 'subt_exec_pm', name: 'Prime Minister', level: 'subtopic', parentId: 'topic_const_exec' },
  { id: 'subt_exec_council', name: 'Council of Ministers', level: 'subtopic', parentId: 'topic_const_exec' },

  // Union Legislature
  { id: 'subt_leg_loksabha', name: 'Lok Sabha', level: 'subtopic', parentId: 'topic_const_legislature' },
  { id: 'subt_leg_rajyasabha', name: 'Rajya Sabha', level: 'subtopic', parentId: 'topic_const_legislature' },
  { id: 'subt_leg_speaker', name: 'Speaker', level: 'subtopic', parentId: 'topic_const_legislature' },
  { id: 'subt_leg_committees', name: 'Parliamentary Committees', level: 'subtopic', parentId: 'topic_const_legislature' },
  { id: 'subt_leg_process', name: 'Legislative Process', level: 'subtopic', parentId: 'topic_const_legislature' },

  // Judiciary
  { id: 'subt_judge_sc', name: 'Supreme Court', level: 'subtopic', parentId: 'topic_const_judiciary' },
  { id: 'subt_judge_hc', name: 'High Courts', level: 'subtopic', parentId: 'topic_const_judiciary' },
  { id: 'subt_judge_review', name: 'Judicial Review', level: 'subtopic', parentId: 'topic_const_judiciary' },
  { id: 'subt_judge_writ', name: 'Writ Jurisdiction', level: 'subtopic', parentId: 'topic_const_judiciary' },
  { id: 'subt_judge_independence', name: 'Judicial Independence', level: 'subtopic', parentId: 'topic_const_judiciary' },

  // State Executive
  { id: 'subt_state_governor', name: 'Governor', level: 'subtopic', parentId: 'topic_const_state_exec' },
  { id: 'subt_state_cm', name: 'Chief Minister', level: 'subtopic', parentId: 'topic_const_state_exec' },
  { id: 'subt_state_council', name: 'State Council of Ministers', level: 'subtopic', parentId: 'topic_const_state_exec' },

  // State Legislature
  { id: 'subt_state_vidhan', name: 'Vidhan Sabha', level: 'subtopic', parentId: 'topic_const_state_leg' },
  { id: 'subt_state_parishad', name: 'Vidhan Parishad', level: 'subtopic', parentId: 'topic_const_state_leg' },

  // Federal System
  { id: 'subt_federal_relations', name: 'Centre-State Relations', level: 'subtopic', parentId: 'topic_const_federal' },
  { id: 'subt_federal_interstate', name: 'Interstate Relations', level: 'subtopic', parentId: 'topic_const_federal' },
  { id: 'subt_federal_emergency', name: 'Emergency Provisions', level: 'subtopic', parentId: 'topic_const_federal' },

  // Local Self Government
  { id: 'subt_lsg_panchayat', name: 'Panchayati Raj', level: 'subtopic', parentId: 'topic_const_lsg' },
  { id: 'subt_lsg_municipality', name: 'Municipalities', level: 'subtopic', parentId: 'topic_const_lsg' },
  { id: 'subt_lsg_amendments', name: '73rd & 74th Amendments', level: 'subtopic', parentId: 'topic_const_lsg' },

  // Constitutional Amendments
  { id: 'subt_amend_major', name: 'Major Amendments', level: 'subtopic', parentId: 'topic_const_amendments' },
  { id: 'subt_amend_basic', name: 'Basic Structure Doctrine', level: 'subtopic', parentId: 'topic_const_amendments' },

  // Constitutional Bodies
  { id: 'subt_bodies_ec', name: 'Election Commission', level: 'subtopic', parentId: 'topic_const_bodies' },
  { id: 'subt_bodies_upse', name: 'UPSC', level: 'subtopic', parentId: 'topic_const_bodies' },
  { id: 'subt_bodies_cag', name: 'CAG', level: 'subtopic', parentId: 'topic_const_bodies' },
  { id: 'subt_bodies_fc', name: 'Finance Commission', level: 'subtopic', parentId: 'topic_const_bodies' },
  { id: 'subt_bodies_ncert', name: 'NCERT', level: 'subtopic', parentId: 'topic_const_bodies' },
  { id: 'subt_bodies_spc', name: 'State Public Service Commissions', level: 'subtopic', parentId: 'topic_const_bodies' },

  // ═══════════════════════════════════════════════
  // GEOGRAPHY
  // ═══════════════════════════════════════════════
  { id: 'topic_geo_physical', name: 'Physical Geography', level: 'topic', parentId: 'subj_geography' },
  { id: 'topic_geo_india', name: 'Indian Geography', level: 'topic', parentId: 'subj_geography', prerequisites: ['topic_geo_physical'] },
  { id: 'topic_geo_world', name: 'World Geography', level: 'topic', parentId: 'subj_geography', prerequisites: ['topic_geo_physical'] },
  { id: 'topic_geo_kerala', name: 'Kerala Geography', level: 'topic', parentId: 'subj_geography', prerequisites: ['topic_geo_physical'] },
  { id: 'topic_geo_env', name: 'Environment & Ecology', level: 'topic', parentId: 'subj_geography', prerequisites: ['topic_geo_india', 'topic_geo_kerala'] },
  { id: 'topic_geo_disaster', name: 'Disaster Management', level: 'topic', parentId: 'subj_geography', prerequisites: ['topic_geo_env'] },

  // Physical Geography
  { id: 'subt_phys_climate', name: 'Climate', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_rivers', name: 'Rivers', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_soils', name: 'Soil Types', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_landforms', name: 'Landforms', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_atmosphere', name: 'Atmosphere', level: 'subtopic', parentId: 'topic_geo_physical' },
  { id: 'subt_phys_ocean', name: 'Oceans', level: 'subtopic', parentId: 'topic_geo_physical' },

  // Indian Geography
  { id: 'subt_india_divisions', name: 'Physical Divisions', level: 'subtopic', parentId: 'topic_geo_india' },
  { id: 'subt_india_rivers', name: 'River Systems', level: 'subtopic', parentId: 'topic_geo_india' },
  { id: 'subt_india_climate', name: 'Climate & Monsoon', level: 'subtopic', parentId: 'topic_geo_india' },
  { id: 'subt_india_agriculture', name: 'Agriculture', level: 'subtopic', parentId: 'topic_geo_india' },
  { id: 'subt_india_minerals', name: 'Mineral Resources', level: 'subtopic', parentId: 'topic_geo_india' },
  { id: 'subt_india_population', name: 'Population', level: 'subtopic', parentId: 'topic_geo_india' },
  { id: 'subt_india_transport', name: 'Transport & Industries', level: 'subtopic', parentId: 'topic_geo_india' },

  // World Geography
  { id: 'subt_world_continents', name: 'Continents', level: 'subtopic', parentId: 'topic_geo_world' },
  { id: 'subt_world_oceans', name: 'Oceans & Seas', level: 'subtopic', parentId: 'topic_geo_world' },
  { id: 'subt_world_mountains', name: 'Major Mountain Ranges', level: 'subtopic', parentId: 'topic_geo_world' },
  { id: 'subt_world_rivers', name: 'Major Rivers', level: 'subtopic', parentId: 'topic_geo_world' },
  { id: 'subt_world_climate', name: 'Climate Zones', level: 'subtopic', parentId: 'topic_geo_world' },

  // Kerala Geography
  { id: 'subt_kerala_districts', name: 'Districts', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_ghats', name: 'Western Ghats', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_backwaters', name: 'Backwaters', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_climate', name: 'Climate of Kerala', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_rivers', name: 'Rivers of Kerala', level: 'subtopic', parentId: 'topic_geo_kerala' },
  { id: 'subt_kerala_soil', name: 'Soil Types of Kerala', level: 'subtopic', parentId: 'topic_geo_kerala' },

  // Environment & Ecology
  { id: 'subt_env_biodiversity', name: 'Biodiversity', level: 'subtopic', parentId: 'topic_geo_env' },
  { id: 'subt_env_ecosystems', name: 'Ecosystems', level: 'subtopic', parentId: 'topic_geo_env' },
  { id: 'subt_env_conservation', name: 'Conservation', level: 'subtopic', parentId: 'topic_geo_env' },
  { id: 'subt_env_pollution', name: 'Pollution', level: 'subtopic', parentId: 'topic_geo_env' },
  { id: 'subt_env_climate_change', name: 'Climate Change', level: 'subtopic', parentId: 'topic_geo_env' },
  { id: 'subt_env_protected', name: 'Protected Areas', level: 'subtopic', parentId: 'topic_geo_env' },

  // Disaster Management
  { id: 'subt_disaster_natural', name: 'Natural Disasters', level: 'subtopic', parentId: 'topic_geo_disaster' },
  { id: 'subt_disaster_manmade', name: 'Man-made Disasters', level: 'subtopic', parentId: 'topic_geo_disaster' },
  { id: 'subt_disaster_mitigation', name: 'Mitigation & Response', level: 'subtopic', parentId: 'topic_geo_disaster' },

  // ═══════════════════════════════════════════════
  // SCIENCE
  // ═══════════════════════════════════════════════
  { id: 'topic_sci_physics', name: 'Physics', level: 'topic', parentId: 'subj_science' },
  { id: 'topic_sci_chemistry', name: 'Chemistry', level: 'topic', parentId: 'subj_science' },
  { id: 'topic_sci_biology', name: 'Biology', level: 'topic', parentId: 'subj_science' },
  { id: 'topic_sci_env_science', name: 'Environmental Science', level: 'topic', parentId: 'subj_science', prerequisites: ['topic_sci_chemistry', 'topic_sci_biology'] },

  // Physics
  { id: 'subt_phys_motion', name: 'Motion & Force', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_energy', name: 'Energy & Work', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_light', name: 'Light & Optics', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_sound', name: 'Sound', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_electricity', name: 'Electricity', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_magnetism', name: 'Magnetism', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_nuclear', name: 'Nuclear Physics', level: 'subtopic', parentId: 'topic_sci_physics' },
  { id: 'subt_phys_electronics', name: 'Basic Electronics', level: 'subtopic', parentId: 'topic_sci_physics' },

  // Chemistry
  { id: 'subt_chem_periodic', name: 'Periodic Table', level: 'subtopic', parentId: 'topic_sci_chemistry' },
  { id: 'subt_chem_reactions', name: 'Chemical Reactions', level: 'subtopic', parentId: 'topic_sci_chemistry' },
  { id: 'subt_chem_acids', name: 'Acids, Bases & Salts', level: 'subtopic', parentId: 'topic_sci_chemistry' },
  { id: 'subt_chem_organic', name: 'Organic Chemistry', level: 'subtopic', parentId: 'topic_sci_chemistry' },
  { id: 'subt_chem_atomic', name: 'Atomic Structure', level: 'subtopic', parentId: 'topic_sci_chemistry' },

  // Biology
  { id: 'subt_bio_human', name: 'Human Body', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_ecology', name: 'Ecology', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_plants', name: 'Plant Kingdom', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_animals', name: 'Animal Kingdom', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_genetics', name: 'Genetics', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_microbes', name: 'Microbiology', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_nutrition', name: 'Nutrition & Health', level: 'subtopic', parentId: 'topic_sci_biology' },
  { id: 'subt_bio_diseases', name: 'Common Diseases', level: 'subtopic', parentId: 'topic_sci_biology' },

  // Environmental Science
  { id: 'subt_envsci_ecosystems', name: 'Ecosystems', level: 'subtopic', parentId: 'topic_sci_env_science' },
  { id: 'subt_envsci_pollution', name: 'Pollution & Control', level: 'subtopic', parentId: 'topic_sci_env_science' },
  { id: 'subt_envsci_conservation', name: 'Conservation', level: 'subtopic', parentId: 'topic_sci_env_science' },

  // ═══════════════════════════════════════════════
  // CURRENT AFFAIRS
  // ═══════════════════════════════════════════════
  { id: 'topic_curr_kerala', name: 'Kerala News', level: 'topic', parentId: 'subj_current' },
  { id: 'topic_curr_national', name: 'National News', level: 'topic', parentId: 'subj_current' },
  { id: 'topic_curr_international', name: 'International News', level: 'topic', parentId: 'subj_current' },
  { id: 'topic_curr_sports', name: 'Sports', level: 'topic', parentId: 'subj_current' },
  { id: 'topic_curr_science', name: 'Science & Technology', level: 'topic', parentId: 'subj_current' },

  // Kerala News
  { id: 'subt_curr_schemes', name: 'Government Schemes', level: 'subtopic', parentId: 'topic_curr_kerala' },
  { id: 'subt_curr_infra', name: 'Infrastructure', level: 'subtopic', parentId: 'topic_curr_kerala' },
  { id: 'subt_curr_budget', name: 'Kerala Budget', level: 'subtopic', parentId: 'topic_curr_kerala' },
  { id: 'subt_curr_events', name: 'Major Events', level: 'subtopic', parentId: 'topic_curr_kerala' },

  // National News
  { id: 'subt_curr_appointments', name: 'Appointments', level: 'subtopic', parentId: 'topic_curr_national' },
  { id: 'subt_curr_awards', name: 'Awards & Honours', level: 'subtopic', parentId: 'topic_curr_national' },
  { id: 'subt_curr_schemes_national', name: 'Central Schemes', level: 'subtopic', parentId: 'topic_curr_national' },
  { id: 'subt_curr_policy', name: 'Policy & Legislation', level: 'subtopic', parentId: 'topic_curr_national' },

  // International News
  { id: 'subt_intl_org', name: 'International Organizations', level: 'subtopic', parentId: 'topic_curr_international' },
  { id: 'subt_intl_summits', name: 'Summits & Agreements', level: 'subtopic', parentId: 'topic_curr_international' },
  { id: 'subt_intl_relations', name: 'India & World', level: 'subtopic', parentId: 'topic_curr_international' },

  // Sports
  { id: 'subt_sports_tournaments', name: 'Major Tournaments', level: 'subtopic', parentId: 'topic_curr_sports' },
  { id: 'subt_sports_winners', name: 'Winners & Venues', level: 'subtopic', parentId: 'topic_curr_sports' },
  { id: 'subt_sports_india', name: 'Indian Sports', level: 'subtopic', parentId: 'topic_curr_sports' },

  // Science & Technology
  { id: 'subt_scitech_space', name: 'Space', level: 'subtopic', parentId: 'topic_curr_science' },
  { id: 'subt_scitech_defence', name: 'Defence', level: 'subtopic', parentId: 'topic_curr_science' },
  { id: 'subt_scitech_it', name: 'IT & Computers', level: 'subtopic', parentId: 'topic_curr_science' },
  { id: 'subt_scitech_health', name: 'Health & Medicine', level: 'subtopic', parentId: 'topic_curr_science' },

  // ═══════════════════════════════════════════════
  // QUANTITATIVE APTITUDE
  // ═══════════════════════════════════════════════
  { id: 'topic_apt_number', name: 'Number System', level: 'topic', parentId: 'subj_aptitude' },
  { id: 'topic_apt_arithmetic', name: 'Arithmetic', level: 'topic', parentId: 'subj_aptitude', prerequisites: ['topic_apt_number'] },
  { id: 'topic_apt_algebra', name: 'Algebra', level: 'topic', parentId: 'subj_aptitude', prerequisites: ['topic_apt_arithmetic'] },
  { id: 'topic_apt_geometry', name: 'Geometry & Mensuration', level: 'topic', parentId: 'subj_aptitude', prerequisites: ['topic_apt_arithmetic'] },
  { id: 'topic_apt_data', name: 'Data Interpretation', level: 'topic', parentId: 'subj_aptitude', prerequisites: ['topic_apt_arithmetic'] },

  // Number System
  { id: 'subt_num_divisibility', name: 'Divisibility Rules', level: 'subtopic', parentId: 'topic_apt_number' },
  { id: 'subt_num_lcm', name: 'LCM & HCF', level: 'subtopic', parentId: 'topic_apt_number' },
  { id: 'subt_num_fractions', name: 'Fractions & Decimals', level: 'subtopic', parentId: 'topic_apt_number' },

  // Arithmetic
  { id: 'subt_apt_percentages', name: 'Percentages', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_ratios', name: 'Ratios & Proportion', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_profit', name: 'Profit & Loss', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_interest', name: 'Simple & Compound Interest', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_speed', name: 'Time, Speed & Distance', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_work', name: 'Time & Work', level: 'subtopic', parentId: 'topic_apt_arithmetic' },
  { id: 'subt_apt_averages', name: 'Averages', level: 'subtopic', parentId: 'topic_apt_arithmetic' },

  // Algebra
  { id: 'subt_algebra_equations', name: 'Simple Equations', level: 'subtopic', parentId: 'topic_apt_algebra' },
  { id: 'subt_algebra_inequalities', name: 'Inequalities', level: 'subtopic', parentId: 'topic_apt_algebra' },

  // Geometry & Mensuration
  { id: 'subt_geom_area', name: 'Area & Perimeter', level: 'subtopic', parentId: 'topic_apt_geometry' },
  { id: 'subt_geom_volume', name: 'Volume & Surface Area', level: 'subtopic', parentId: 'topic_apt_geometry' },

  // Data Interpretation
  { id: 'subt_apt_charts', name: 'Charts & Graphs', level: 'subtopic', parentId: 'topic_apt_data' },
  { id: 'subt_apt_tables', name: 'Tables', level: 'subtopic', parentId: 'topic_apt_data' },
  { id: 'subt_apt_caselet', name: 'Caselets', level: 'subtopic', parentId: 'topic_apt_data' },

  // ═══════════════════════════════════════════════
  // MENTAL ABILITY
  // ═══════════════════════════════════════════════
  { id: 'topic_mental_series', name: 'Series Completion', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_analogy'] },
  { id: 'topic_mental_analogy', name: 'Analogy & Classification', level: 'topic', parentId: 'subj_mental' },
  { id: 'topic_mental_coding', name: 'Coding-Decoding', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_series'] },
  { id: 'topic_mental_blood', name: 'Blood Relations', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_coding'] },
  { id: 'topic_mental_direction', name: 'Direction Sense', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_blood'] },
  { id: 'topic_mental_syllogism', name: 'Syllogisms', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_direction'] },
  { id: 'topic_mental_venn', name: 'Venn Diagrams', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_syllogism'] },
  { id: 'topic_mental_puzzles', name: 'Puzzles', level: 'topic', parentId: 'subj_mental', prerequisites: ['topic_mental_venn'] },

  // Series Completion
  { id: 'subt_series_number', name: 'Number Series', level: 'subtopic', parentId: 'topic_mental_series' },
  { id: 'subt_series_alphabet', name: 'Alphabet Series', level: 'subtopic', parentId: 'topic_mental_series' },

  // Analogy & Classification
  { id: 'subt_analogy_verbal', name: 'Verbal Analogy', level: 'subtopic', parentId: 'topic_mental_analogy' },
  { id: 'subt_analogy_nonverbal', name: 'Non-Verbal Analogy', level: 'subtopic', parentId: 'topic_mental_analogy' },
  { id: 'subt_analogy_classification', name: 'Classification', level: 'subtopic', parentId: 'topic_mental_analogy' },

  // Coding-Decoding
  { id: 'subt_coding_letter', name: 'Letter Coding', level: 'subtopic', parentId: 'topic_mental_coding' },
  { id: 'subt_coding_number', name: 'Number Coding', level: 'subtopic', parentId: 'topic_mental_coding' },

  // Blood Relations
  { id: 'subt_blood_family', name: 'Family Trees', level: 'subtopic', parentId: 'topic_mental_blood' },
  { id: 'subt_blood_coded', name: 'Coded Relations', level: 'subtopic', parentId: 'topic_mental_blood' },

  // Direction Sense
  { id: 'subt_direction_basic', name: 'Basic Directions', level: 'subtopic', parentId: 'topic_mental_direction' },
  { id: 'subt_direction_distance', name: 'Distance & Direction', level: 'subtopic', parentId: 'topic_mental_direction' },

  // Syllogisms
  { id: 'subt_syllogism_basic', name: 'Basic Syllogisms', level: 'subtopic', parentId: 'topic_mental_syllogism' },
  { id: 'subt_syllogism_possibility', name: 'Possibility Cases', level: 'subtopic', parentId: 'topic_mental_syllogism' },

  // Venn Diagrams
  { id: 'subt_venn_basic', name: 'Basic Venn', level: 'subtopic', parentId: 'topic_mental_venn' },
  { id: 'subt_venn_advanced', name: 'Advanced Venn', level: 'subtopic', parentId: 'topic_mental_venn' },

  // Puzzles
  { id: 'subt_puzzles_sitting', name: 'Seating Arrangement', level: 'subtopic', parentId: 'topic_mental_puzzles' },
  { id: 'subt_puzzles_ordering', name: 'Order & Ranking', level: 'subtopic', parentId: 'topic_mental_puzzles' },
  { id: 'subt_puzzles_scheduling', name: 'Scheduling', level: 'subtopic', parentId: 'topic_mental_puzzles' },

  // ═══════════════════════════════════════════════
  // MALAYALAM
  // ═══════════════════════════════════════════════
  { id: 'topic_mal_grammar', name: 'Grammar', level: 'topic', parentId: 'subj_malayalam' },
  { id: 'topic_mal_literature', name: 'Literature', level: 'topic', parentId: 'subj_malayalam', prerequisites: ['topic_mal_grammar'] },
  { id: 'topic_mal_poetry', name: 'Poetry', level: 'topic', parentId: 'subj_malayalam', prerequisites: ['topic_mal_literature'] },
  { id: 'topic_mal_prose', name: 'Prose & Drama', level: 'topic', parentId: 'subj_malayalam', prerequisites: ['topic_mal_literature'] },

  // Grammar
  { id: 'subt_mal_sandhi', name: 'Sandhi', level: 'subtopic', parentId: 'topic_mal_grammar' },
  { id: 'subt_mal_samasa', name: 'Samasa', level: 'subtopic', parentId: 'topic_mal_grammar' },
  { id: 'subt_mal_gender', name: 'Gender & Number', level: 'subtopic', parentId: 'topic_mal_grammar' },
  { id: 'subt_mal_tense', name: 'Tense & Aspect', level: 'subtopic', parentId: 'topic_mal_grammar' },
  { id: 'subt_mal_case', name: 'Case System', level: 'subtopic', parentId: 'topic_mal_grammar' },
  { id: 'subt_mal_ala', name: 'Alankaram', level: 'subtopic', parentId: 'topic_mal_grammar' },

  // Literature
  { id: 'subt_mal_ancient_poets', name: 'Ancient Poets', level: 'subtopic', parentId: 'topic_mal_literature' },
  { id: 'subt_mal_modern', name: 'Modern Literature', level: 'subtopic', parentId: 'topic_mal_literature' },
  { id: 'subt_mal_novel', name: 'Novel', level: 'subtopic', parentId: 'topic_mal_literature' },
  { id: 'subt_mal_shortstory', name: 'Short Story', level: 'subtopic', parentId: 'topic_mal_literature' },
  { id: 'subt_mal_folk', name: 'Folk Literature', level: 'subtopic', parentId: 'topic_mal_literature' },

  // Poetry
  { id: 'subt_poetry_adhunika', name: 'Adhunika Poetry', level: 'subtopic', parentId: 'topic_mal_poetry' },
  { id: 'subt_poetry_kilippattu', name: 'Kilippattu', level: 'subtopic', parentId: 'topic_mal_poetry' },
  { id: 'subt_poetry_mahakavya', name: 'Mahakavya', level: 'subtopic', parentId: 'topic_mal_poetry' },

  // Prose & Drama
  { id: 'subt_prose_drama', name: 'Drama', level: 'subtopic', parentId: 'topic_mal_prose' },
  { id: 'subt_prose_autobiography', name: 'Autobiography', level: 'subtopic', parentId: 'topic_mal_prose' },
  { id: 'subt_prose_travelogue', name: 'Travelogue', level: 'subtopic', parentId: 'topic_mal_prose' },

  // ═══════════════════════════════════════════════
  // INDIAN HISTORY & NATIONAL MOVEMENT
  // ═══════════════════════════════════════════════
  { id: 'topic_india_ancient', name: 'Ancient India', level: 'topic', parentId: 'subj_indian_history' },
  { id: 'topic_india_medieval', name: 'Medieval India', level: 'topic', parentId: 'subj_indian_history', prerequisites: ['topic_india_ancient'] },
  { id: 'topic_india_british', name: 'British Rule & Early Struggles', level: 'topic', parentId: 'subj_indian_history', prerequisites: ['topic_india_medieval'] },
  { id: 'topic_india_national', name: 'Indian National Movement', level: 'topic', parentId: 'subj_indian_history', prerequisites: ['topic_india_british'] },

  { id: 'subt_india_ivc', name: 'Indus Valley Civilization', level: 'subtopic', parentId: 'topic_india_ancient' },
  { id: 'subt_india_vedic', name: 'Vedic Period', level: 'subtopic', parentId: 'topic_india_ancient' },
  { id: 'subt_india_maurya', name: 'Maurya Empire', level: 'subtopic', parentId: 'topic_india_ancient' },
  { id: 'subt_india_gupta', name: 'Gupta Empire', level: 'subtopic', parentId: 'topic_india_ancient' },
  { id: 'subt_india_south', name: 'South Indian Dynasties', level: 'subtopic', parentId: 'topic_india_ancient' },

  { id: 'subt_india_delhi', name: 'Delhi Sultanate', level: 'subtopic', parentId: 'topic_india_medieval' },
  { id: 'subt_india_mughal', name: 'Mughal Empire', level: 'subtopic', parentId: 'topic_india_medieval' },
  { id: 'subt_india_maratha', name: 'Maratha Empire', level: 'subtopic', parentId: 'topic_india_medieval' },

  { id: 'subt_india_plassey', name: 'Battle of Plassey & Buxar', level: 'subtopic', parentId: 'topic_india_british' },
  { id: 'subt_india_1857', name: 'Revolt of 1857', level: 'subtopic', parentId: 'topic_india_british' },

  { id: 'subt_india_congress', name: 'INC Formation & Early Sessions', level: 'subtopic', parentId: 'topic_india_national' },
  { id: 'subt_india_gandhi', name: 'Gandhian Movements', level: 'subtopic', parentId: 'topic_india_national' },
  { id: 'subt_india_quit', name: 'Quit India Movement', level: 'subtopic', parentId: 'topic_india_national' },
  { id: 'subt_india_partition', name: 'Partition & Independence', level: 'subtopic', parentId: 'topic_india_national' },

  // ═══════════════════════════════════════════════
  // WORLD HISTORY
  // ═══════════════════════════════════════════════
  { id: 'topic_world_revolutions', name: 'Great Revolutions', level: 'topic', parentId: 'subj_world_history' },
  { id: 'topic_world_wars', name: 'World Wars & International Alliances', level: 'topic', parentId: 'subj_world_history' },

  { id: 'subt_world_french', name: 'French Revolution', level: 'subtopic', parentId: 'topic_world_revolutions' },
  { id: 'subt_world_industrial', name: 'Industrial Revolution', level: 'subtopic', parentId: 'topic_world_revolutions' },
  { id: 'subt_world_russian', name: 'Russian Revolution', level: 'subtopic', parentId: 'topic_world_revolutions' },

  { id: 'subt_world_ww1', name: 'First World War', level: 'subtopic', parentId: 'topic_world_wars' },
  { id: 'subt_world_ww2', name: 'Second World War', level: 'subtopic', parentId: 'topic_world_wars' },
  { id: 'subt_world_un', name: 'United Nations', level: 'subtopic', parentId: 'topic_world_wars' },
  { id: 'subt_world_cold', name: 'Cold War', level: 'subtopic', parentId: 'topic_world_wars' },

  // ═══════════════════════════════════════════════
  // CIVICS & PUBLIC ADMINISTRATION
  // ═══════════════════════════════════════════════
  { id: 'topic_civics_bureaucracy', name: 'Bureaucracy & Administrative Machinery', level: 'topic', parentId: 'subj_civics' },
  { id: 'topic_civics_digital', name: 'Digital Governance & E-Governance', level: 'topic', parentId: 'subj_civics' },
  { id: 'topic_civics_welfare', name: 'Social Welfare & Public Policy', level: 'topic', parentId: 'subj_civics' },

  { id: 'subt_civics_services', name: 'Indian Civil Services', level: 'subtopic', parentId: 'topic_civics_bureaucracy' },
  { id: 'subt_civics_kas', name: 'KAS & State Services', level: 'subtopic', parentId: 'topic_civics_bureaucracy' },
  { id: 'subt_civics_negp', name: 'National E-Governance Plan', level: 'subtopic', parentId: 'topic_civics_digital' },
  { id: 'subt_civics_akshaya', name: 'Kerala E-Services', level: 'subtopic', parentId: 'topic_civics_digital' },
  { id: 'subt_civics_citizen', name: 'Citizen Charters', level: 'subtopic', parentId: 'topic_civics_welfare' },

  // ═══════════════════════════════════════════════
  // INDIAN ECONOMY
  // ═══════════════════════════════════════════════
  { id: 'topic_econ_national', name: 'National Income & Macroeconomic Indicators', level: 'topic', parentId: 'subj_indian_economy' },
  { id: 'topic_econ_banking', name: 'Banking & Monetary Policy', level: 'topic', parentId: 'subj_indian_economy' },
  { id: 'topic_econ_fiscal', name: 'Public Finance & Fiscal System', level: 'topic', parentId: 'subj_indian_economy' },
  { id: 'topic_econ_sectors', name: 'Sectors of Indian Economy', level: 'topic', parentId: 'subj_indian_economy' },
  { id: 'topic_econ_planning', name: 'Planning & Development', level: 'topic', parentId: 'subj_indian_economy' },

  { id: 'subt_econ_gdp', name: 'GDP, GNP, NNP Concepts', level: 'subtopic', parentId: 'topic_econ_national' },
  { id: 'subt_econ_inflation', name: 'Inflation Indicators', level: 'subtopic', parentId: 'topic_econ_national' },
  { id: 'subt_econ_rbi', name: 'RBI Functions', level: 'subtopic', parentId: 'topic_econ_banking' },
  { id: 'subt_econ_repo', name: 'Repo, CRR, SLR', level: 'subtopic', parentId: 'topic_econ_banking' },
  { id: 'subt_econ_gst', name: 'GST Architecture', level: 'subtopic', parentId: 'topic_econ_fiscal' },
  { id: 'subt_econ_budget', name: 'Union Budget', level: 'subtopic', parentId: 'topic_econ_fiscal' },
  { id: 'subt_econ_agriculture', name: 'Agriculture & Reforms', level: 'subtopic', parentId: 'topic_econ_sectors' },
  { id: 'subt_econ_msme', name: 'MSME & Industry', level: 'subtopic', parentId: 'topic_econ_sectors' },
  { id: 'subt_econ_plans', name: 'Five-Year Plans', level: 'subtopic', parentId: 'topic_econ_planning' },
  { id: 'subt_econ_hdi', name: 'HDI & Poverty', level: 'subtopic', parentId: 'topic_econ_planning' },

  // ═══════════════════════════════════════════════
  // KERALA ECONOMY
  // ═══════════════════════════════════════════════
  { id: 'topic_ker_econ_model', name: 'Kerala Model of Development', level: 'topic', parentId: 'subj_kerala_economy' },
  { id: 'topic_ker_econ_safety', name: 'Socio-Economic Safety Networks', level: 'topic', parentId: 'subj_kerala_economy' },
  { id: 'topic_ker_econ_fiscal', name: 'Kerala Fiscal & Industrial Landscape', level: 'topic', parentId: 'subj_kerala_economy' },

  { id: 'subt_ker_econ_land', name: 'Land Reforms', level: 'subtopic', parentId: 'topic_ker_econ_model' },
  { id: 'subt_ker_econ_kudumbashree', name: 'Kudumbashree Mission', level: 'subtopic', parentId: 'topic_ker_econ_safety' },
  { id: 'subt_ker_econ_remittance', name: 'Pravasi & Remittances', level: 'subtopic', parentId: 'topic_ker_econ_safety' },
  { id: 'subt_ker_econ_tourism', name: 'Tourism Sector', level: 'subtopic', parentId: 'topic_ker_econ_fiscal' },
  { id: 'subt_ker_econ_it', name: 'IT Sector', level: 'subtopic', parentId: 'topic_ker_econ_fiscal' },

  // ═══════════════════════════════════════════════
  // INFORMATION TECHNOLOGY & CYBER LAWS
  // ═══════════════════════════════════════════════
  { id: 'topic_it_hardware', name: 'Computer Hardware & Architecture', level: 'topic', parentId: 'subj_it' },
  { id: 'topic_it_software', name: 'Software & Operating Systems', level: 'topic', parentId: 'subj_it' },
  { id: 'topic_it_networks', name: 'Networks & Internet', level: 'topic', parentId: 'subj_it' },
  { id: 'topic_it_web', name: 'Web Technologies & Languages', level: 'topic', parentId: 'subj_it' },
  { id: 'topic_it_security', name: 'Cyber Security & Threats', level: 'topic', parentId: 'subj_it' },
  { id: 'topic_it_act', name: 'IT Act & Legal Frameworks', level: 'topic', parentId: 'subj_it' },

  { id: 'subt_it_cpu', name: 'CPU & Memory', level: 'subtopic', parentId: 'topic_it_hardware' },
  { id: 'subt_it_storage', name: 'Storage Devices', level: 'subtopic', parentId: 'topic_it_hardware' },
  { id: 'subt_it_os', name: 'Operating Systems', level: 'subtopic', parentId: 'topic_it_software' },
  { id: 'subt_it_lan', name: 'LAN, WAN, MAN', level: 'subtopic', parentId: 'topic_it_networks' },
  { id: 'subt_it_osi', name: 'OSI Model', level: 'subtopic', parentId: 'topic_it_networks' },
  { id: 'subt_it_tcpip', name: 'TCP/IP & Protocols', level: 'subtopic', parentId: 'topic_it_networks' },
  { id: 'subt_it_html', name: 'HTML, CSS, JavaScript', level: 'subtopic', parentId: 'topic_it_web' },
  { id: 'subt_it_malware', name: 'Malware & Attacks', level: 'subtopic', parentId: 'topic_it_security' },
  { id: 'subt_it_crypto', name: 'Cryptography & Encryption', level: 'subtopic', parentId: 'topic_it_security' },
  { id: 'subt_it_itact', name: 'IT Act 2000 & Amendments', level: 'subtopic', parentId: 'topic_it_act' },

  // ═══════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════
  { id: 'topic_eng_grammar', name: 'Grammar', level: 'topic', parentId: 'subj_english' },
  { id: 'topic_eng_vocab', name: 'Vocabulary', level: 'topic', parentId: 'subj_english' },
  { id: 'topic_eng_reading', name: 'Reading Comprehension & Writing', level: 'topic', parentId: 'subj_english' },

  { id: 'subt_eng_tenses', name: 'Tenses & Voice', level: 'subtopic', parentId: 'topic_eng_grammar' },
  { id: 'subt_eng_verbs', name: 'Subject-Verb Agreement', level: 'subtopic', parentId: 'topic_eng_grammar' },
  { id: 'subt_eng_synonyms', name: 'Synonyms & Antonyms', level: 'subtopic', parentId: 'topic_eng_vocab' },
  { id: 'subt_eng_idioms', name: 'Idioms & Phrases', level: 'subtopic', parentId: 'topic_eng_vocab' },
  { id: 'subt_eng_comprehension', name: 'Unseen Passage Comprehension', level: 'subtopic', parentId: 'topic_eng_reading' },
  { id: 'subt_eng_cloze', name: 'Cloze Test', level: 'subtopic', parentId: 'topic_eng_reading' },

  // ═══════════════════════════════════════════════
  // ARTS, SPORTS & CULTURE
  // ═══════════════════════════════════════════════
  { id: 'topic_arts_classical', name: 'Classical & Ritualistic Art Forms', level: 'topic', parentId: 'subj_arts' },
  { id: 'topic_arts_folk', name: 'Folk & Traditional Arts', level: 'topic', parentId: 'subj_arts' },
  { id: 'topic_arts_cinema', name: 'Malayalam Cinema', level: 'topic', parentId: 'subj_arts' },
  { id: 'topic_arts_sports', name: 'Sports & Athletics', level: 'topic', parentId: 'subj_arts' },

  { id: 'subt_arts_kathakali', name: 'Kathakali', level: 'subtopic', parentId: 'topic_arts_classical' },
  { id: 'subt_arts_theyyam', name: 'Theyyam', level: 'subtopic', parentId: 'topic_arts_classical' },
  { id: 'subt_arts_kalaripayattu', name: 'Kalaripayattu', level: 'subtopic', parentId: 'topic_arts_folk' },
  { id: 'subt_arts_vallam', name: 'Vallam Kali', level: 'subtopic', parentId: 'topic_arts_folk' },
  { id: 'subt_arts_film', name: 'Malayalam Film History', level: 'subtopic', parentId: 'topic_arts_cinema' },
  { id: 'subt_arts_olympics', name: 'Olympics & Asian Games', level: 'subtopic', parentId: 'topic_arts_sports' },
  { id: 'subt_arts_kerala_athletes', name: 'Kerala Athletes', level: 'subtopic', parentId: 'topic_arts_sports' },

  // ═══════════════════════════════════════════════
  // SPECIAL ACTS & SOCIAL WELFARE
  // ═══════════════════════════════════════════════
  { id: 'topic_act_human', name: 'Human Rights & Civil Rights', level: 'topic', parentId: 'subj_special_acts' },
  { id: 'topic_act_gender', name: 'Gender & Child Welfare', level: 'topic', parentId: 'subj_special_acts' },
  { id: 'topic_act_transparency', name: 'Transparency & Anti-Corruption', level: 'topic', parentId: 'subj_special_acts' },

  { id: 'subt_act_atrocities', name: 'SC/ST Atrocities Act', level: 'subtopic', parentId: 'topic_act_human' },
  { id: 'subt_act_domestic', name: 'Domestic Violence Act', level: 'subtopic', parentId: 'topic_act_gender' },
  { id: 'subt_act_pocso', name: 'POCSO Act', level: 'subtopic', parentId: 'topic_act_gender' },
  { id: 'subt_act_rti', name: 'Right to Information Act', level: 'subtopic', parentId: 'topic_act_transparency' },
  { id: 'subt_act_consumer', name: 'Consumer Protection Act', level: 'subtopic', parentId: 'topic_act_transparency' },
  { id: 'subt_act_cvc', name: 'CVC & Lokayukta', level: 'subtopic', parentId: 'topic_act_transparency' },
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

export function getPrerequisites(nodeId: string): KnowledgeNode[] {
  const node = NODE_MAP.get(nodeId);
  if (!node?.prerequisites?.length) return [];
  return node.prerequisites.map((id) => NODE_MAP.get(id)).filter(Boolean) as KnowledgeNode[];
}

export function getDependents(nodeId: string): KnowledgeNode[] {
  return TREE.filter((n) => n.prerequisites?.includes(nodeId));
}

export function getPrerequisiteChain(nodeId: string): KnowledgeNode[][] {
  const chains: KnowledgeNode[][] = [];
  const node = NODE_MAP.get(nodeId);
  if (!node?.prerequisites?.length) return chains;
  for (const prereqId of node.prerequisites) {
    const prereq = NODE_MAP.get(prereqId);
    if (prereq) {
      const subChain = getPrerequisiteChain(prereqId);
      if (subChain.length) {
        for (const chain of subChain) chains.push([prereq, ...chain]);
      } else {
        chains.push([prereq]);
      }
    }
  }
  return chains;
}

export function arePrerequisitesMet(nodeId: string, masteryMap: Record<string, { masteryScore: number }>, threshold = 60): { met: boolean; unmet: string[] } {
  const node = NODE_MAP.get(nodeId);
  if (!node?.prerequisites?.length) return { met: true, unmet: [] };
  const unmet: string[] = [];
  for (const prereqId of node.prerequisites) {
    const prereqNode = NODE_MAP.get(prereqId);
    const mastery = masteryMap[prereqId];
    if (!mastery || mastery.masteryScore < threshold) {
      unmet.push(prereqNode?.name ?? prereqId);
    }
  }
  return { met: unmet.length === 0, unmet };
}
