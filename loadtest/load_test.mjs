#!/usr/bin/env node

/**
 * Load test for AI question generation.
 *
 * Usage: node load_test.mjs [concurrent_users] [duration_seconds]
 *   Default: 10 users for 60 seconds
 *   Examples:
 *     node load_test.mjs 10 30    # 10 users, 30 seconds
 *     node load_test.mjs 50 120   # 50 users, 2 minutes
 *     node load_test.mjs 100 60   # 100 users, 1 minute
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-question`;

const CONCURRENT_USERS = parseInt(process.argv[2] || '10', 10);
const DURATION_SECONDS = parseInt(process.argv[3] || '60', 10);

const TOPICS = [
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'easy' },
  { subject: 'Kerala History', topic: 'Medieval Kerala', difficulty: 'medium' },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'hard' },
  { subject: 'Constitution', topic: 'Fundamental Rights', difficulty: 'easy' },
  { subject: 'Constitution', topic: 'Directive Principles', difficulty: 'medium' },
  { subject: 'Renaissance', topic: 'Sree Narayana Guru', difficulty: 'easy' },
  { subject: 'Renaissance', topic: 'Temple Entry Movement', difficulty: 'medium' },
  { subject: 'Geography', topic: 'Districts', difficulty: 'easy' },
  { subject: 'Geography', topic: 'Rivers', difficulty: 'medium' },
  { subject: 'Science', topic: 'Chemistry', difficulty: 'easy' },
  { subject: 'Science', topic: 'Human Body', difficulty: 'medium' },
  { subject: 'Malayalam', topic: 'Ancient Poets', difficulty: 'easy' },
  { subject: 'Mental Ability', topic: 'Analogies', difficulty: 'easy' },
  { subject: 'Quantitative Aptitude', topic: 'Percentages', difficulty: 'easy' },
];

// Metrics
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let rateLimited = 0;
const latencies = [];
let cacheHits = 0;
let cacheMisses = 0;

// In-memory local cache for the test (simulating the app cache)
const localCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(subject, topic, difficulty) {
  const key = `${subject}|${topic}|${difficulty}|en`;
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    localCache.delete(key);
    return null;
  }
  return entry.question;
}

function setCache(subject, topic, difficulty, question) {
  const key = `${subject}|${topic}|${difficulty}|en`;
  localCache.set(key, { question, ts: Date.now() });
}

async function makeRequest(userId, iteration) {
  const pick = TOPICS[Math.floor(Math.random() * TOPICS.length)];

  // Check local cache
  const cached = getCached(pick.subject, pick.topic, pick.difficulty);
  if (cached) {
    cacheHits++;
    return { cached: true, latency: 0 };
  }
  cacheMisses++;

  const body = {
    subject: pick.subject,
    topic: pick.topic,
    difficulty: pick.difficulty,
    examType: 'LDC',
    language: 'en',
    topicConstraint: `PREFERRED TOPIC: Generate a question about "${pick.topic}" within the subject "${pick.subject}".`,
  };

  const start = Date.now();
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const latency = Date.now() - start;
    totalRequests++;

    if (res.ok) {
      const data = await res.json();
      if (data.question) {
        successfulRequests++;
        latencies.push(latency);
        setCache(pick.subject, pick.topic, pick.difficulty, data);
        return { cached: false, latency, success: true };
      } else {
        failedRequests++;
        return { cached: false, latency, success: false, error: 'empty response' };
      }
    } else if (res.status === 429) {
      rateLimited++;
      failedRequests++;
      return { cached: false, latency, success: false, error: '429' };
    } else if (res.status === 502) {
      failedRequests++;
      return { cached: false, latency, success: false, error: '502' };
    } else {
      failedRequests++;
      return { cached: false, latency, success: false, error: String(res.status) };
    }
  } catch (err) {
    totalRequests++;
    failedRequests++;
    return { cached: false, latency: Date.now() - start, success: false, error: err.message };
  }
}

async function simulateUser(userId) {
  const endTime = Date.now() + DURATION_SECONDS * 1000;
  let iteration = 0;
  while (Date.now() < endTime) {
    await makeRequest(userId, iteration++);
    // Random think time between 2-8 seconds (simulating user reading & answering)
    const thinkTime = 2000 + Math.random() * 6000;
    await new Promise(r => setTimeout(r, thinkTime));
  }
}

async function printReport(concurrentUsers, durationSeconds) {
  const totalCalls = totalRequests;
  const elapsedMs = durationSeconds * 1000;
  const rpm = totalCalls / (durationSeconds / 60);
  const successRate = totalCalls > 0 ? (successfulRequests / totalCalls * 100) : 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;
  const avg = len > 0 ? sorted.reduce((s, v) => s + v, 0) / len : 0;
  const p50 = len > 0 ? sorted[Math.floor(len * 0.5)] : 0;
  const p95 = len > 0 ? sorted[Math.floor(len * 0.95)] : 0;
  const p99 = len > 0 ? sorted[Math.floor(len * 0.99)] : 0;
  const cacheTotal = cacheHits + cacheMisses;
  const cacheHitRate = cacheTotal > 0 ? (cacheHits / cacheTotal * 100) : 0;

  const report = `
══════════════════════════════════════════════════
  LOAD TEST REPORT
══════════════════════════════════════════════════
  Configuration:
    Concurrent Users:     ${concurrentUsers}
    Duration:             ${durationSeconds}s
    Edge Function:        generate-question

  Volume:
    Total Requests:       ${totalCalls}
    Successful:           ${successfulRequests}
    Failed:               ${failedRequests}
    Rate Limited (429):   ${rateLimited}
    Success Rate:         ${successRate.toFixed(1)}%
    Effective RPM:        ${rpm.toFixed(1)}

  Latency (ms):
    Average:              ${Math.round(avg)}
    Median (P50):         ${p50}
    P95:                  ${p95}
    P99:                  ${p99}

  Cache (simulated local):
    Hits:                 ${cacheHits}
    Misses:               ${cacheMisses}
    Hit Rate:             ${cacheHitRate.toFixed(1)}%

  Observations:
    ${
      rateLimited > 0
        ? `⚠ Rate limiting detected (${rateLimited} occurrences). Queue implementation needed.`
        : '✅ No rate limiting detected.'
    }
    ${
      successRate < 90
        ? `⚠ Success rate below 90%. Review error distribution.`
        : successRate < 95
          ? `⚠ Success rate between 90-95%. Monitor closely.`
          : '✅ Success rate is healthy.'
    }
    ${
      p95 > 15000
        ? '⚠ P95 latency exceeds 15s. Consider prefetching and caching.'
        : p95 > 8000
          ? '⚠ P95 latency is 8-15s. Monitor for degradation.'
          : '✅ Latency is acceptable.'
    }
    ${
      concurrentUsers > 80 && rpm < 10
        ? '⚠ RPM did not scale with user count. Backend bottleneck suspected.'
        : ''
    }
══════════════════════════════════════════════════
`.trim();

  console.log(`\n${report}\n`);
}

async function main() {
  console.log(`\n🚀 Starting load test: ${CONCURRENT_USERS} concurrent users for ${DURATION_SECONDS}s`);
  console.log(`   Target: ${FUNCTION_URL}`);
  console.log('   Press Ctrl+C to abort\n');

  const startTime = Date.now();

  const users = Array.from({ length: CONCURRENT_USERS }, (_, i) => simulateUser(i));
  await Promise.all(users);

  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n✅ Test completed in ${elapsedSeconds}s`);
  await printReport(CONCURRENT_USERS, DURATION_SECONDS);

  // Exit with code based on success rate
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) : 0;
  process.exit(successRate >= 0.9 ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
