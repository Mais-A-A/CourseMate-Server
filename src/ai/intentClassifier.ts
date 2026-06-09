import { geminiModel } from '../config/gemini.js'
import { parseModelResponseContent } from '../shared/utils/AIUtils.js'

export enum Intent {
  GENERATE_SCHEDULE = 'generate_schedule',
  GENERAL_UNI_QUESTION = 'general_uni_question',
  ADVISOR_REQUEST = 'advisor_request',
  GREETING = 'greeting',
  OTHER = 'other',
}

const CLASSIFIER_PROMPT = `You are an intent classifier for a university student assistant called CourseMate.
Classify the following student question into exactly one of these categories:

- generate_schedule: student wants to build, plan, or generate their course/semester schedule
- general_uni_question: question about university rules, policies, departments, fees, academic regulations, or general university information
- advisor_request: student asking about their own grades, GPA, courses, warnings, or academic status
- greeting: any greeting or introduction (e.g. hello, hi, مرحبا, السلام عليكم, كيفك, صباح الخير)
- other: unclear questions, or anything that doesn't fit above

Return ONLY the category name, nothing else. No explanation, no punctuation.

Question: `

const GREETING_REGEX =
  /^(مرحب|السلام|صباح|مساء|أهلا|اهلا|هلا|هاي|هلو|hello|hi\b|hey|good\s+morning|good\s+evening|كيفك|كيف حالك|ازيك)/i

export async function classifyIntent(question: string): Promise<Intent> {
  if (GREETING_REGEX.test(question.trim())) return Intent.GREETING

  try {
    const result = await geminiModel.invoke(CLASSIFIER_PROMPT + question)
    const raw = parseModelResponseContent(result.content).trim().toLowerCase()

    const validIntents = Object.values(Intent)
    const matched = validIntents.find((intent) => raw.includes(intent))

    return matched ?? Intent.OTHER
  } catch {
    return Intent.OTHER
  }
}
