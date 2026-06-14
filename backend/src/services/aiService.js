// AI Service — Server-side Groq API integration with prompt engineering
const config = require('../config');
const logger = require('../utils/logger');

// Fallback question banks (moved from client-side aiService.js)
const fallbackQuestions = require('./fallbackQuestions');

/**
 * Shuffle the options within each question so the correct answer
 * position is randomized.
 */
const shuffleQuestionOptions = (questions) => {
  return questions.map(q => {
    const correctAnswer = q.options[q.correct];
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
  });
};

/**
 * Sanitize user-provided subject string to prevent prompt injection.
 * Strips special characters, limits length.
 */
const sanitizeSubject = (subject) => {
  if (typeof subject !== 'string') return 'General';
  return subject
    .replace(/[^a-zA-Z0-9\s&()/+#\-.]/g, '') // only safe characters
    .trim()
    .slice(0, 100);
};

/**
 * Build the Groq chat messages for quiz generation.
 */
const buildQuizMessages = (subject, numberOfQuestions, difficulty) => {
  const difficultyDescription = {
    easy: 'basic and straightforward, suitable for beginners',
    medium: 'moderate complexity, requiring good understanding',
    hard: 'challenging and complex, requiring deep knowledge',
    adaptive: 'mixed difficulty ranging from easy to hard',
  };

  const safeSubject = sanitizeSubject(subject);

  return [
    {
      role: 'system',
      content: `You are an educational quiz generator for a CS/MCA learning platform.
RULES:
1. Return ONLY a valid JSON array, no markdown, no extra text, no code fences
2. Each element must have: id (number), question (string), options (array of 4 strings), correct (0-3), explanation (string)
3. The correct answer index MUST be randomly distributed across 0-3
4. Questions must be factually accurate
5. Never include offensive or inappropriate content
6. Return exactly ${numberOfQuestions} questions`
    },
    {
      role: 'user',
      content: `Generate exactly ${numberOfQuestions} multiple choice questions for a ${safeSubject} test.
Difficulty level: ${difficultyDescription[difficulty] || difficultyDescription.medium}

Requirements:
- Each question MUST have exactly 4 options
- "correct" is the 0-based index of the correct answer (0, 1, 2, or 3)
- IMPORTANT: Vary the position of the correct answer randomly across questions
- Questions should test knowledge of ${safeSubject}
- Make questions educational and appropriate for students aged 16+
- Vary the topics within ${safeSubject}
- Include practical application questions where applicable

Return ONLY the JSON array, no other text.`
    }
  ];
};

/**
 * Validate the parsed quiz response.
 * Returns { valid: true, questions: [...] } or { valid: false, error: '...' }
 */
const validateQuizResponse = (data, expectedCount) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { valid: false, error: 'Response is not a valid array' };
  }

  const validated = [];
  for (let i = 0; i < Math.min(data.length, expectedCount); i++) {
    const q = data[i];

    if (!q.question || typeof q.question !== 'string') {
      return { valid: false, error: `Question ${i + 1} is missing text` };
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, error: `Question ${i + 1} must have exactly 4 options` };
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
      return { valid: false, error: `Question ${i + 1} has invalid correct index` };
    }
    // Check for duplicate options
    const uniqueOpts = new Set(q.options.map(o => o.toLowerCase().trim()));
    if (uniqueOpts.size < 3) {
      return { valid: false, error: `Question ${i + 1} has duplicate options` };
    }

    validated.push({
      id: q.id || i + 1,
      question: q.question.trim(),
      options: q.options.map(o => String(o).trim()),
      correct: q.correct,
      explanation: q.explanation || 'No explanation provided',
    });
  }

  return { valid: true, questions: validated };
};

/**
 * Call the Groq API to generate quiz questions.
 * Includes retry logic with exponential backoff.
 */
const generateAITest = async (subject, {
  numberOfQuestions = 10,
  difficulty = 'medium',
  timeLimit = 15,
  userAvgScore = null,
  maxRetries = 2,
} = {}) => {
  const startTime = Date.now();
  logger.info('AI', 'AI request received', { subject, numberOfQuestions, difficulty });

  // If no API key configured, go straight to fallback
  if (!config.groq.apiKey) {
    logger.warn('AI', 'No GROQ_API_KEY configured, using fallback questions');
    return generateFallbackTest(subject, numberOfQuestions, difficulty, timeLimit);
  }

  // Compute effective difficulty from user score if adaptive
  const effectiveDifficulty = difficulty === 'adaptive'
    ? computeAdaptiveDifficulty(userAvgScore)
    : difficulty;

  const messages = buildQuizMessages(subject, numberOfQuestions, effectiveDifficulty);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('AI', `Groq API call attempt ${attempt + 1}/${maxRetries + 1}`);

      const response = await fetch(config.groq.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.groq.apiKey}`,
        },
        body: JSON.stringify({
          model: config.groq.model,
          messages,
          temperature: 0.7,
          max_tokens: 8192,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          logger.warn('AI', `Groq rate limited (attempt ${attempt + 1}/${maxRetries + 1})`);
          if (attempt < maxRetries) {
            await sleep(1000 * (attempt + 1));
            continue;
          }
          logger.warn('AI', 'All retries exhausted due to rate limiting, using fallback');
          return generateFallbackTest(subject, numberOfQuestions, effectiveDifficulty, timeLimit);
        }
        const errBody = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errBody}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        throw new Error('No response content from Groq');
      }

      // Parse JSON from response (handle markdown code blocks)
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
      else if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
      if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
      cleanedText = cleanedText.trim();

      let parsed = JSON.parse(cleanedText);

      // Groq with response_format: json_object may wrap in an object
      // e.g. { "questions": [...] }
      if (!Array.isArray(parsed) && parsed.questions && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      }

      // Validate
      const validation = validateQuizResponse(parsed, numberOfQuestions);
      if (!validation.valid) {
        logger.warn('AI', `Response validation failed: ${validation.error}`, { attempt: attempt + 1 });
        if (attempt < maxRetries) {
          await sleep(500 * (attempt + 1));
          continue;
        }
        logger.warn('AI', 'Validation exhausted, using fallback');
        return generateFallbackTest(subject, numberOfQuestions, effectiveDifficulty, timeLimit);
      }

      const questions = shuffleQuestionOptions(
        validation.questions.map(q => ({ ...q, difficulty: effectiveDifficulty }))
      );

      const durationMs = Date.now() - startTime;
      logger.aiSuccess(subject, questions.length, 'ai', durationMs);

      return {
        success: true,
        data: {
          questions,
          subject,
          difficulty: effectiveDifficulty,
          timeLimit,
          totalQuestions: questions.length,
          generatedAt: new Date().toISOString(),
          source: 'ai',
        },
      };
    } catch (error) {
      logger.aiError(subject, attempt + 1, error);
      if (attempt >= maxRetries) {
        return generateFallbackTest(subject, numberOfQuestions, effectiveDifficulty, timeLimit);
      }
      await sleep(1000 * (attempt + 1));
    }
  }

  // Should not reach here, but safety fallback
  return generateFallbackTest(subject, numberOfQuestions, effectiveDifficulty, timeLimit);
};

/**
 * Compute adaptive difficulty from user's average score.
 */
const computeAdaptiveDifficulty = (avgScore) => {
  if (avgScore === null || avgScore === undefined) return 'medium';
  if (avgScore >= 80) return 'hard';
  if (avgScore >= 60) return 'medium';
  return 'easy';
};

/**
 * Generate a fallback test from the predefined question bank
 * when AI generation fails.
 */
const generateFallbackTest = (subject, count, difficulty, timeLimit) => {
  logger.info('AI', 'Using fallback question bank', { subject, count });
  const questions = fallbackQuestions.getQuestions(subject, count);
  const shuffled = shuffleQuestionOptions(questions);

  return {
    success: true,
    data: {
      questions: shuffled,
      subject,
      difficulty,
      timeLimit: timeLimit || 15,
      totalQuestions: shuffled.length,
      generatedAt: new Date().toISOString(),
      source: 'fallback',
    },
  };
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { generateAITest, validateQuizResponse, sanitizeSubject };
