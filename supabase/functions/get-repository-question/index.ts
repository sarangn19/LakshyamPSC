import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, apikey',
};

function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { subject, topic, difficulty, examTypes, language, avoidIds, count = 1 } = await req.json();

    if (!subject) {
      return corsResponse({ error: 'Missing required field: subject' }, 400);
    }

    // Phase 1: Query repository for matching questions
    let query = supabase
      .from('question_bank_mcqs')
      .select('*')
      .eq('subject', subject)
      .eq('status', 'active')
      .order('usage_count', { ascending: true })
      .limit(count);

    if (topic) {
      query = query.eq('topic', topic);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (language) {
      query = query.eq('language', language);
    }
    if (examTypes && examTypes.length > 0) {
      query = query.overlaps('exam_types', examTypes);
    }
    if (avoidIds && avoidIds.length > 0) {
      query = query.not('id', 'in', `(${avoidIds.map((id: string) => `'${id}'`).join(',')})`);
    }

    const { data: questions, error: queryError } = await query;

    if (queryError) {
      console.error('Repository query error:', queryError);
      // Fall through to AI generation
    }

    if (questions && questions.length > 0) {
      // Repository hit — record metadata and return
      const latency = Date.now() - startTime;
      await supabase.from('generation_metadata').insert({
        subject,
        topic: topic || null,
        difficulty: difficulty || null,
        language: language || 'en',
        source: questions[0].source || 'ai_generated',
        result: 'repository_hit',
        latency_ms: latency,
        question_id: questions[0].id,
      }).catch(() => {});

      // Increment usage count
      await supabase.rpc('increment_question_usage', { p_question_id: questions[0].id }).catch(() => {});

      return corsResponse({
        found: true,
        source: 'repository',
        question: {
          id: questions[0].id,
          text: questions[0].question_text,
          options: questions[0].options,
          correctAnswer: questions[0].correct_answer,
          subject: questions[0].subject,
          topic: questions[0].topic,
          subtopic: questions[0].subtopic,
          difficulty: questions[0].difficulty,
          explanation: questions[0].explanation,
          examType: questions[0].exam_types || [questions[0].exam_type],
          source: questions[0].source,
          confidence: questions[0].quality_score || 1.0,
          generatedAt: questions[0].created_at,
        },
        repositoryHit: true,
        latency,
      });
    }

    // Phase 2: Repository miss — generate via AI
    const genBody = {
      subject,
      topic,
      difficulty: difficulty || 'medium',
      examType: (examTypes && examTypes[0]) || 'LDC',
      language: language || 'en',
      focusInstruction: `Generate a ${difficulty || 'medium'}-difficulty question about ${topic || subject}`,
      topicConstraint: `Generate a question about "${topic || subject}" within subject "${subject}"`,
    };

    const genRes = await fetch(`${supabaseUrl}/functions/v1/generate-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(genBody),
    });

    const genLatency = Date.now() - startTime;

    if (!genRes.ok) {
      const errText = await genRes.text().catch(() => '');
      await supabase.from('generation_metadata').insert({
        subject,
        topic: topic || null,
        difficulty: difficulty || null,
        language: language || 'en',
        source: 'ai_generated',
        result: 'ai_failed',
        latency_ms: genLatency,
        error_message: `HTTP ${genRes.status}: ${errText.substring(0, 200)}`,
      }).catch(() => {});

      return corsResponse({
        found: false,
        source: 'ai_failed',
        repositoryHit: false,
        error: `AI generation failed (HTTP ${genRes.status})`,
        latency: genLatency,
      }, 502);
    }

    const aiData = await genRes.json();

    if (aiData.error) {
      await supabase.from('generation_metadata').insert({
        subject,
        topic: topic || null,
        difficulty: difficulty || null,
        language: language || 'en',
        source: 'ai_generated',
        result: 'ai_failed',
        latency_ms: genLatency,
        error_message: aiData.error,
      }).catch(() => {});

      return corsResponse({
        found: false,
        source: 'ai_failed',
        repositoryHit: false,
        error: aiData.error,
        latency: genLatency,
      }, 502);
    }

    // Phase 3: Store generated question in repository
    const actualSubject = aiData.subject || subject;
    const actualTopic = aiData.topic || topic || subject;
    const questionHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(aiData.question + JSON.stringify(aiData.options || [])),
    ).then((h) => {
      const hash = Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
      return hash.substring(0, 16);
    });

    let storedId: string | null = null;

    // Check for duplicate before storing
    const { data: existing } = await supabase
      .from('question_bank_mcqs')
      .select('id')
      .eq('question_hash', questionHash)
      .maybeSingle();

    if (!existing) {
      const { data: stored } = await supabase
        .from('question_bank_mcqs')
        .insert({
          question_text: aiData.question,
          options: aiData.options || [],
          correct_answer: aiData.correctAnswer,
          explanation: aiData.explanation || '',
          subject: actualSubject,
          topic: actualTopic,
          subtopic: aiData.subtopic || null,
          difficulty: genBody.difficulty,
          exam_type: genBody.examType,
          exam_types: examTypes || [genBody.examType],
          language: language || 'en',
          source_type: 'ai_generated',
          source: 'ai_generated',
          question_hash: questionHash,
          quality_score: aiData.confidence || 80,
          tags: [actualSubject, actualTopic],
        })
        .select('id')
        .single();

      storedId = stored?.id || null;
    } else {
      storedId = existing.id;
    }

    // Record generation metadata
    await supabase.from('generation_metadata').insert({
      subject: actualSubject,
      topic: actualTopic,
      difficulty: genBody.difficulty,
      language: language || 'en',
      source: 'ai_generated',
      result: 'ai_generated',
      latency_ms: genLatency,
      question_id: storedId,
    }).catch(() => {});

    return corsResponse({
      found: true,
      source: 'ai_generated',
      repositoryHit: false,
      question: {
        id: storedId || `ai_${Date.now()}`,
        text: aiData.question,
        options: aiData.options,
        correctAnswer: aiData.correctAnswer,
        subject: actualSubject,
        topic: actualTopic,
        subtopic: aiData.subtopic || null,
        difficulty: genBody.difficulty,
        explanation: aiData.explanation || '',
        examType: examTypes || [genBody.examType],
        source: 'ai_generated',
        confidence: aiData.confidence || 80,
        generatedAt: new Date().toISOString(),
      },
      latency: genLatency,
    });
  } catch (error) {
    console.error('Error in get-repository-question:', error);
    return corsResponse({
      found: false,
      source: 'error',
      repositoryHit: false,
      error: 'Internal server error',
      latency: Date.now() - startTime,
    }, 500);
  }
});
