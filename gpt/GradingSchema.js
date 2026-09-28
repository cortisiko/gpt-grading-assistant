// Structured Outputs schema for the grading response. With `strict: true` the
// API guarantees the reply matches this shape. The model only picks a level;
// points are derived from LEVEL_POINTS in code so the arithmetic is always correct.

export const QUESTION_TITLES = [
  "Feature Testing on a Release Build",
  "Testing Across Devices",
  "Automating vs. Manual Testing",
  "Bug Fix Validation",
  "Device Nuances",
  "Debugging and isolating e2e test failures on CI",
];

export const LEVEL_POINTS = {
  Unanswered: 0,
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};

export const MAX_POINTS = QUESTION_TITLES.length * LEVEL_POINTS.Advanced;

export const gradingResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "grading_results",
    strict: true,
    schema: {
      type: "object",
      properties: {
        candidates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_number: {
                      type: "integer",
                      enum: QUESTION_TITLES.map((title, index) => index + 1),
                    },
                    // Rationale comes before level so the model reasons first.
                    rationale: { type: "string" },
                    level: {
                      type: "string",
                      enum: Object.keys(LEVEL_POINTS),
                    },
                  },
                  required: ["question_number", "rationale", "level"],
                  additionalProperties: false,
                },
              },
              areas_to_improve: {
                type: "array",
                items: { type: "string" },
              },
              ai_generated: {
                type: "object",
                properties: {
                  explanation: { type: "string" },
                  likely_ai_generated: { type: "boolean" },
                },
                required: ["explanation", "likely_ai_generated"],
                additionalProperties: false,
              },
            },
            required: ["name", "questions", "areas_to_improve", "ai_generated"],
            additionalProperties: false,
          },
        },
      },
      required: ["candidates"],
      additionalProperties: false,
    },
  },
};
