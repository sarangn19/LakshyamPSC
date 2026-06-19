import { GeneratedQuestion } from './aiMCQGenerator';
import { syllabus } from '../data/syllabus';

// ─── Enforcement result ───

export interface TopicEnforcementResult {
  accepted: boolean;
  rejectionReason: string | null;
  requestedSubject: string;
  requestedTopic: string | undefined;
  generatedSubject: string;
  generatedTopic: string;
  generatedSubtopic: string;
}

export interface TopicEnforcementLog {
  timestamp: string;
  requestedSubject: string;
  requestedTopic: string | undefined;
  generatedSubject: string;
  generatedTopic: string;
  accepted: boolean;
  rejectionReason: string | null;
}

// ─── Helpers ───

function getTopicsForSubject(subjectName: string): string[] {
  const subj = syllabus.find((s) => s.name === subjectName);
  return subj ? subj.topics.map((t) => t.name) : [];
}

// ─── Strict topic enforcement ───
//
// Rule 1: If recommendation targets a Topic (e.g. "Modern Kerala"):
//   - Accept ONLY questions whose topic === "Modern Kerala"
//   - Reject everything else (Ancient Kerala, Medieval Kerala, Renaissance, Constitution)
//
// Rule 2: If recommendation targets a Subject only (e.g. "Kerala History", no topic):
//   - Accept any topic within that subject

export function enforceTopicFocus(
  question: GeneratedQuestion,
  requestedSubject: string,
  requestedTopic: string | undefined,
): TopicEnforcementResult {
  if (!requestedSubject) {
    // No recommendation at all — pass through
    return {
      accepted: true,
      rejectionReason: null,
      requestedSubject: '',
      requestedTopic: undefined,
      generatedSubject: question.subject,
      generatedTopic: question.topic,
      generatedSubtopic: question.subtopic ?? '',
    };
  }

  // Case: Topic-level recommendation → strict exact topic match
  if (requestedTopic) {
    if (question.topic === requestedTopic) {
      return {
        accepted: true,
        rejectionReason: null,
        requestedSubject,
        requestedTopic,
        generatedSubject: question.subject,
        generatedTopic: question.topic,
        generatedSubtopic: question.subtopic ?? '',
      };
    }
    return {
      accepted: false,
      rejectionReason: `recommended topic "${requestedTopic}" but got "${question.topic}" (subject: ${question.subject})`,
      requestedSubject,
      requestedTopic,
      generatedSubject: question.subject,
      generatedTopic: question.topic,
      generatedSubtopic: question.subtopic ?? '',
    };
  }

  // Case: Subject-level recommendation → accept any topic within subject
  const subjectTopics = getTopicsForSubject(requestedSubject);
  if (subjectTopics.length > 0 && subjectTopics.includes(question.topic)) {
    return {
      accepted: true,
      rejectionReason: null,
      requestedSubject,
      requestedTopic: undefined,
      generatedSubject: question.subject,
      generatedTopic: question.topic,
      generatedSubtopic: question.subtopic ?? '',
    };
  }

  return {
    accepted: false,
    rejectionReason: `recommended subject "${requestedSubject}" but got topic "${question.topic}" from subject "${question.subject}"`,
    requestedSubject,
    requestedTopic: undefined,
    generatedSubject: question.subject,
    generatedTopic: question.topic,
    generatedSubtopic: question.subtopic ?? '',
  };
}

// ─── Build structured log entry ───

export function buildEnforcementLog(result: TopicEnforcementResult): TopicEnforcementLog {
  return {
    timestamp: new Date().toISOString(),
    requestedSubject: result.requestedSubject,
    requestedTopic: result.requestedTopic,
    generatedSubject: result.generatedSubject,
    generatedTopic: result.generatedTopic,
    accepted: result.accepted,
    rejectionReason: result.rejectionReason,
  };
}
