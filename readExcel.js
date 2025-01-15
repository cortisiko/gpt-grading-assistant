import xlsx from "xlsx";

function getResponseData(objectData) {
  let responseData = [];
  responseData = Object.values(objectData);
  // objectData.forEach((key, value) => {
  //   responseData = value;
  // });

  return responseData;
}

function readExcelData() {
  try {
    // Use readFile from the xlsx default export
    const workbook = xlsx.readFile("spreadsheet.xlsx");
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // console.log(data);
    let bam = getResponseData(data);
    console.log(bam);
  } catch (error) {
    console.error("Error reading Excel file:", error);
  }
  return data;
}

function chatGPTAssessment() {}

function exportToPDF() {}
readExcelData();
