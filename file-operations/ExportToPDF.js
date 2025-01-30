import fs from "fs";
import PDFDocument from "pdfkit";

// Ensure the Results directory exists
const resultsDir = "./Results";
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function createIndividualPDF(name, grade, assessmentResults) {
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
  doc.fontSize(14).font("Helvetica-Bold").text(`Grade: ${grade}`).moveDown(1);

  // Add Assessment Results
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Assessment Results:")
    .moveDown(0.5);

  assessmentResults.forEach((result) => {
    doc.fontSize(12).font("Helvetica").text(result.trim()).moveDown(0.3);
  });

  // Finalize the PDF when the stream closes
  doc.end();
  return new Promise((resolve) => {
    stream.on("finish", () => {
      console.log(`✅ Created PDF: ${fileName}`);
      resolve();
    });
  });
}

async function parseAndCreatePDFs(data) {
  if (!data || typeof data !== "string") {
    console.error("❌ Invalid data: content must be a string.");
    return;
  }

  // Split the content into sections based on "---"
  const sections = data.split("---").map((section) => section.trim());

  for (const section of sections) {
    if (section.startsWith("### Name")) {
      // Extract Name
      const nameMatch = section.match(/^### Name: (.+)$/m);
      const name = nameMatch ? nameMatch[1] : "Unknown";

      // Extract Grade
      const gradeMatch = section.match(/\*\*Grade:\*\* ([0-9]+\/[0-9]+)/m);
      const grade = gradeMatch ? gradeMatch[1] : "N/A";

      // Extract Assessment Results
      const resultsStartIndex = section.indexOf("**Assessment results:**");
      const gradeIndex = section.indexOf("**Grade:**");
      let assessmentResults = [];

      if (resultsStartIndex !== -1 && gradeIndex !== -1) {
        const resultsText = section
          .substring(
            resultsStartIndex + "**Assessment results:**".length,
            gradeIndex
          )
          .trim();
        assessmentResults = resultsText.split("\n").map((line) => line.trim());
      }

      // Create PDF for this person (wait for it to finish before starting the next)
      await createIndividualPDF(name, grade, assessmentResults);
    }
  }
}

export { parseAndCreatePDFs };
