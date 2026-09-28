import fs from "fs";
import PDFDocument from "pdfkit";
import { MAX_POINTS } from "../gpt/GradingSchema.js";

// Ensure the Results directory exists
const resultsDir = "./Results";
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function createIndividualPDF(candidate) {
  const {
    name,
    questions,
    totalPoints,
    areas_to_improve: areasToImprove,
    ai_generated: aiGeneratedAssessment,
  } = candidate;
  const fileName = `${resultsDir}/assessment_results_${name.replace(
    /\s+/g,
    "_"
  )}.pdf`;

  const doc = new PDFDocument({ margin: 40 });

  // Save PDF to a file
  const stream = fs.createWriteStream(fileName);
  doc.pipe(stream);

  // Add Title
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Assessment Results", { align: "center", underline: true })
    .moveDown(2);

  // Add Name
  doc.fontSize(16).font("Helvetica-Bold").text(`Name: ${name}`).moveDown();

  // Add Grade
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`Grade: ${totalPoints}/${MAX_POINTS}`)
    .moveDown(1);

  // Add Assessment Results
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Assessment Results:")
    .moveDown(0.5);

  questions.forEach((question) => {
    const pointsLabel = question.points === 1 ? "point" : "points";
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(
        `${question.questionNumber}. ${question.title} - ${question.level}: ${question.points} ${pointsLabel}`
      );
    doc.fontSize(11).font("Helvetica").text(question.rationale).moveDown(0.5);
  });

  // Add Areas to Improve
  if (areasToImprove.length > 0) {
    doc
      .moveDown(0.5)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Areas to Improve:")
      .moveDown(0.5);
    doc.fontSize(11).font("Helvetica").list(areasToImprove).moveDown(0.5);
  }

  // Add AI-generated assessment
  doc
    .moveDown(0.5)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(
      `Likely AI-generated: ${
        aiGeneratedAssessment.likely_ai_generated ? "Yes" : "No"
      }`
    );
  doc.fontSize(11).font("Helvetica").text(aiGeneratedAssessment.explanation);

  // Finalize the PDF when the stream closes
  doc.end();
  return new Promise((resolve) => {
    stream.on("finish", () => {
      console.log(`✅ Created PDF: ${fileName}`);
      resolve();
    });
  });
}

async function createCandidatePDFs(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    console.error("❌ Invalid data: expected a non-empty array of candidates.");
    return;
  }

  // Create PDFs sequentially (wait for each to finish before starting the next)
  for (const candidate of candidates) {
    await createIndividualPDF(candidate);
  }
}

export { createCandidatePDFs };
