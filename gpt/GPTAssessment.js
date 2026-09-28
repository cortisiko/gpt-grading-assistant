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

// Even at temperature 0 the API is not fully deterministic, so a borderline
// question can flip between levels. Grading several times and taking the
// majority level per question keeps the final grade stable.
const GRADING_RUNS = 5;

const requestGrades = async (prompt, spreadsheetJson) => {
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

  // A change in system_fingerprint means OpenAI changed the backend, which can shift grades.
  console.log(`system_fingerprint: ${completion.system_fingerprint}`);

  const { message, finish_reason: finishReason } = completion.choices[0];
  if (message.refusal) {
    throw new Error(`Model refused: ${message.refusal}`);
  }
  if (finishReason !== "stop") {
    throw new Error(`Incomplete response (finish_reason: ${finishReason})`);
  }

  return JSON.parse(message.content).candidates;
};

// Most common level wins; a tie goes to the lower level, matching the rubric's
// "when in doubt, choose the lower one" rule.
const pickMajorityLevel = (levels) => {
  const voteCounts = new Map();
  levels.forEach((level) =>
    voteCounts.set(level, (voteCounts.get(level) ?? 0) + 1)
  );
  return [...voteCounts.entries()].sort(
    ([levelA, votesA], [levelB, votesB]) =>
      votesB - votesA || LEVEL_POINTS[levelA] - LEVEL_POINTS[levelB]
  )[0][0];
};

// Merges one candidate's results from every run into a single result. Each
// question takes the majority level (with a rationale from a run that chose
// that level); areas to improve and the AI-generated verdict come from the
// run that agreed with the majority on the most questions.
const combineCandidateRuns = (name, candidateRuns) => {
  const questions = QUESTION_TITLES.map((title, index) => {
    const questionNumber = index + 1;
    const grades = candidateRuns
      .map((run) =>
        run.questions.find((grade) => grade.question_number === questionNumber)
      )
      .filter(Boolean);
    if (grades.length === 0) return undefined;

    const levels = grades.map((grade) => grade.level);
    const majorityLevel = pickMajorityLevel(levels);
    if (new Set(levels).size > 1) {
      console.log(
        `⚠️  ${name}, question ${questionNumber}: split vote [${levels.join(", ")}] → ${majorityLevel}`
      );
    }
    return grades.find((grade) => grade.level === majorityLevel);
  }).filter(Boolean);

  const countMajorityMatches = (run) =>
    questions.filter((majorityGrade) =>
      run.questions.some(
        (grade) =>
          grade.question_number === majorityGrade.question_number &&
          grade.level === majorityGrade.level
      )
    ).length;
  const mostRepresentativeRun = candidateRuns.reduce((bestRun, run) =>
    countMajorityMatches(run) > countMajorityMatches(bestRun) ? run : bestRun
  );

  return {
    name,
    questions,
    areas_to_improve: mostRepresentativeRun.areas_to_improve,
    ai_generated: mostRepresentativeRun.ai_generated,
  };
};

const gradeCandidateResponses = async (spreadsheetJson) => {
  try {
    const prompt = await readPrompt();
    const runs = await Promise.all(
      Array.from({ length: GRADING_RUNS }, () =>
        requestGrades(prompt, spreadsheetJson)
      )
    );

    const runsByCandidateName = new Map();
    runs.flat().forEach((candidate) => {
      const candidateRuns = runsByCandidateName.get(candidate.name) ?? [];
      runsByCandidateName.set(candidate.name, [...candidateRuns, candidate]);
    });

    return [...runsByCandidateName.entries()].map(([name, candidateRuns]) =>
      addPointsToCandidate(combineCandidateRuns(name, candidateRuns))
    );
  } catch (error) {
    console.error("Error grading candidate responses:", error);
    return [];
  }
};

export { readPrompt, gradeCandidateResponses };
