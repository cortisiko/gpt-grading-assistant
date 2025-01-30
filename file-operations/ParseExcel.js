import xlsx from "xlsx";
import PDFDocument from "pdfkit";
import fs from "fs";
function getResponseData(objectData) {
  let responseData = [];
  responseData = Object.values(objectData);
  // objectData.forEach((key, value) => {
  //   responseData = value;
  // });

  return responseData;
}

const readExcelData = async () => {
  try {
    // Use readFile from the xlsx default export
    const workbook = xlsx.readFile("spreadsheet.xlsx");
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    const formattedExcelData = JSON.stringify(data, null, 2);

    // console.log(data);
    let bam = getResponseData(data);
    return formattedExcelData;
  } catch (error) {
    console.error("Error reading Excel file:", error);
  }
};

function chatGPTAssessment() {}

const exportToPDF = async (data) => {
  const doc = new PDFDocument();

  // Save PDF to a file
  doc.pipe(fs.createWriteStream("assessment_results.pdf"));

  // Add Title
  doc
    .fontSize(20)
    .text("Assessment Results", { align: "center", underline: true })
    .moveDown(2);

  // Split the content into sections based on "---" as a separator
  const sections = data.split("---").map((section) => section.trim());

  sections.forEach((section) => {
    if (section.startsWith("### Name")) {
      // Add Name
      const nameMatch = section.match(/^### Name: (.+)$/m);
      if (nameMatch) {
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(`Name: ${nameMatch[1]}`)
          .moveDown();
      }
    }

    // Add Assessment Results
    const resultsMatch = section.match(/Assessment results:\n([\s\S]+?)\n\n/m);
    if (resultsMatch) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Assessment Results:")
        .moveDown(0.5);

      const results = resultsMatch[1].trim().split("\n");
      results.forEach((result) => {
        doc.fontSize(12).font("Helvetica").text(result.trim()).moveDown(0.5);
      });
    }

    // Add Grade
    const gradeMatch = section.match(/\*\*Grade:\*\* (.+)$/m);
    if (gradeMatch) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Grade: ${gradeMatch[1]}`)
        .moveDown();
    }

    // Add Areas to Improve
    const improveMatch = section.match(
      /\*\*Areas to Improve:\*\*\n([\s\S]+)$/m
    );
    if (improveMatch) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Areas to Improve:")
        .moveDown(0.5);

      const improvements = improveMatch[1].trim().split("\n");
      improvements.forEach((improvement) => {
        doc
          .fontSize(12)
          .font("Helvetica")
          .text(`- ${improvement.trim()}`)
          .moveDown(0.5);
      });
    }

    // Add spacing between sections
    doc.moveDown(2);
  });

  // Finalize the PDF
  doc.end();
};
export { readExcelData, exportToPDF };
