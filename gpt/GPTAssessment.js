import OpenAI from "openai";
import fs from "fs";
import {
  gradingResponseFormat,
  LEVEL_POINTS,
  QUESTION_TITLES,
} from "./GradingSchema.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pin a dated snapshot: the "gpt-4o" alias can silently move to a new model.
const MODEL = "gpt-4o-2024-08-06";

const readPrompt = async () => {
  const filename = "gpt/prompt.txt";
  try {
    const data = fs.readFileSync(filename, "utf8");
    return data;
  } catch (error) {
    console.error(`Error reading ${filename}: ${error}`);
    return "";
  }
};

// Returns every question in order (any the model skipped count as Unanswered)
// with points and the total computed from each level.
const addPointsToCandidate = (candidate) => {
  const gradesByQuestionNumber = new Map(
    candidate.questions.map((grade) => [grade.question_number, grade])
  );
  const questions = QUESTION_TITLES.map((title, index) => {
    const questionNumber = index + 1;
    const grade = gradesByQuestionNumber.get(questionNumber) ?? {
      rationale: "No grade returned for this question.",
      level: "Unanswered",
    };
    return {
      questionNumber,
      title,
      level: grade.level,
      rationale: grade.rationale,
      points: LEVEL_POINTS[grade.level],
    };
  });
  const totalPoints = questions.reduce(
    (sum, question) => sum + question.points,
    0
  );
  return { ...candidate, questions, totalPoints };
};

const gradeCandidateResponses = async (spreadsheetJson) => {
  try {
    const prompt = await readPrompt();

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      response_format: gradingResponseFormat,
      messages: [
        {
          role: "system",
          content: `You are a skilled Mobile QA engineer acting as a grading assistant. Grade strictly against the rubric below.\n\n${prompt}`,
        },
        {
          role: "user",
          content: `Here are the candidate responses as JSON:\n${spreadsheetJson}`,
        },
      ],
    });

    // Changes in system_fingerprint explain run-to-run differences despite the fixed seed.
    console.log(`system_fingerprint: ${completion.system_fingerprint}`);

    const { message, finish_reason: finishReason } = completion.choices[0];
    if (message.refusal) {
      throw new Error(`Model refused: ${message.refusal}`);
    }
    if (finishReason !== "stop") {
      throw new Error(`Incomplete response (finish_reason: ${finishReason})`);
    }

    const { candidates } = JSON.parse(message.content);
    return candidates.map(addPointsToCandidate);
  } catch (error) {
    console.error("Error grading candidate responses:", error);
    return [];
  }
};

export { readPrompt, gradeCandidateResponses };
