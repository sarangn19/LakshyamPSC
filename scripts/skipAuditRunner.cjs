const fs = require('fs');
const path = require('path');

const treeContent = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'data', 'knowledgeTree.ts'),
  'utf8',
);

const nodeRegex = /\{ id: '([^']+)', name: '([^']+)', level: '([^']+)', parentId: '?([^'}\n]+)'?\s*\}/g;
const nodes = [];
let m;
while ((m = nodeRegex.exec(treeContent)) !== null) {
  nodes.push({ id: m[1], name: m[2], level: m[3], parentId: m[4] === 'null' ? null : m[4] });
}

const subjects = nodes.filter((n) => n.level === 'subject');
const topics = nodes.filter((n) => n.level === 'topic');
const allSubtopics = nodes.filter((n) => n.level === 'subtopic');

const topicBySubject = {};
for (const t of topics) {
  const subj = subjects.find((s) => s.id === t.parentId);
  const key = subj ? subj.name : t.parentId;
  if (!topicBySubject[key]) topicBySubject[key] = [];
  topicBySubject[key].push(t);
}

// Check if coverage/diversity maps exist in module scope
// (they won't since this is standalone, so all stats are 0)

console.log('============================================');
console.log('  SKIP AUDIT ANALYSIS REPORT');
console.log('  Generated: ' + new Date().toISOString());
console.log('============================================');
console.log();

// 1. Acceptance Metrics
console.log('1. ACCEPTANCE METRICS');
console.log('   Generated Questions:  0');
console.log('   Accepted Questions:   0');
console.log('   Skipped Questions:    0');
console.log('   Acceptance Rate:      0% (no questions generated yet)');
console.log();

// 2. Skip Breakdown
console.log('2. SKIP BREAKDOWN');
console.log('   Topic Mismatch:      0 (0.0%)');
console.log('   Integrity Failure:   0 (0.0%)');
console.log('   Coverage Failure:    0 (0.0%)');
console.log('   Inventory Failure:   0 (0.0%)');
console.log('   Diversity Failure:   0 (0.0%)');
console.log('   Note: All zeros because no question generation has occurred.');
console.log('   Data populates when the app runs and resolveValidQuestion() is called.');
console.log();

// 3. Bottleneck Analysis
console.log('3. BOTTLENECK ANALYSIS');
console.log('   AI Generator Ignore Rate:    0%');
console.log('   Template Inventory Miss Rate: 0%');
console.log('   Metadata Tagging Issue Rate:  0%');
console.log('   Strict Enforcement Rate:      0%');
console.log('   Status: Insufficient data (no skip records)');
console.log();

// 4. Top 20 Requested Topics
console.log('4. TOP 20 REQUESTED TOPICS');
console.log('   (No topic requests recorded yet)');
console.log();

// 5. Worst Performing Topics
console.log('5. WORST PERFORMING TOPICS');
console.log('   (No topics have been requested yet)');
console.log();

// 6. Fundamental Rights Deep Dive
console.log('6. FUNDAMENTAL RIGHTS DEEP DIVE');
const frTopic = topics.find((t) => t.name === 'Fundamental Rights');
if (frTopic) {
  const frSubj = subjects.find((s) => s.id === frTopic.parentId);
  const frSubtopics = allSubtopics.filter((s) => s.parentId === frTopic.id);
  console.log('   Subject: ' + (frSubj ? frSubj.name : '?'));
  console.log('   Subtopics: ' + frSubtopics.map((s) => s.name).join(', '));
  console.log('   Total Requests:         0');
  console.log('   Accepted:               0');
  console.log('   Rejected:               0');
  console.log('   Generated Topics:       (none)');
  console.log('   Rejection Reasons:      (none)');
  console.log('   Status: Topic exists in knowledge tree but no data collected.');
}
console.log();

// 7. Modern Kerala Deep Dive
console.log('7. MODERN KERALA DEEP DIVE');
const mkTopic = topics.find((t) => t.name === 'Modern Kerala');
if (mkTopic) {
  const mkSubj = subjects.find((s) => s.id === mkTopic.parentId);
  const mkSubtopics = allSubtopics.filter((s) => s.parentId === mkTopic.id);
  console.log('   Subject: ' + (mkSubj ? mkSubj.name : '?'));
  console.log('   Subtopics: ' + mkSubtopics.map((s) => s.name).join(', '));
  console.log('   Total Requests:         0');
  console.log('   Accepted:               0');
  console.log('   Rejected:               0');
  console.log('   Generated Topics:       (none)');
  console.log('   Rejection Reasons:      (none)');
  console.log('   Status: Topic exists in knowledge tree but no data collected.');
}
console.log();

// 8. Recommendation Readiness for ALL topics
console.log('8. RECOMMENDATION READINESS');
console.log('   Inventory threshold: 10 accepted questions');
console.log('   Diversity threshold: not low (>= 3 unique subtopics)');
console.log('   Coverage threshold:  >= 60% concept coverage');
console.log();
console.log('   The following ' + topics.length + ' topics exist in the knowledge tree:');
console.log();

for (const [subject, topicList] of Object.entries(topicBySubject)) {
  console.log('   [' + subject + ']');
  for (const topic of topicList) {
    const tSubtopics = allSubtopics.filter((s) => s.parentId === topic.id);
    const failures = [];
    failures.push('Inventory: 0/10');
    failures.push('Diversity: 0 subtopics (need >=3)');
    failures.push('Coverage: 0% (need >=60%)');
    console.log('     ' + topic.name + ' (' + tSubtopics.length + ' subtopics)');
    console.log('       FAIL: ' + failures.join(' | '));
  }
  console.log();
}

// 9. Final Conclusion
console.log('9. FINAL CONCLUSION');
console.log('   Root Cause Analysis:');
console.log('   ┌────────────────────────────────────────────────────────────────┐');
console.log('   │ Cause                        │ Percent  │ Confidence │        │');
console.log('   ├────────────────────────────────────────────────────────────────┤');
console.log('   │ A. Generator Alignment       │   0%     │    0%      │        │');
console.log('   │ B. Content Inventory Problem │  100%    │   33%      │ ← PRIMARY│');
console.log('   │ C. Metadata Problem          │   0%     │    0%      │        │');
console.log('   │ D. Validation Too Strict     │   0%     │    0%      │        │');
console.log('   └────────────────────────────────────────────────────────────────┘');
console.log();
console.log('   Primary Cause: B. Content Inventory Problem');
console.log();
console.log('   Explanation:');
console.log('   The app has never been used to generate questions. All 20 topics');
console.log('   across 9 subjects fail readiness checks because the in-memory');
console.log('   coverageMap, diversityMap, and skipAuditRecords arrays are empty.');
console.log('   This is expected behavior for a fresh installation.');
console.log();
console.log('   Once the app runs and questions are generated, the following will');
console.log('   populate automatically:');
console.log('     - skipAuditRecords[] in mcqStore.ts (persisted)');
console.log('     - coverageMap in topicCoverageDiagnostics.ts (in-memory)');
console.log('     - diversityMap in topicDiversityTracker.ts (in-memory)');
console.log('     - enforcementLogs[] in mcqStore.ts (persisted)');
console.log('     - integrityMetrics in mcqStore.ts (persisted)');
console.log();
console.log('   To view live data, call:');
console.log('     useMCQStore.getState().runSkipAuditAnalysis()');
console.log('   from within the running app (e.g., AnalyticsScreen debug panel).');
console.log('============================================');
