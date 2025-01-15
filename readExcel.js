import xlsx from 'xlsx';

function readExcelData() {
  try {
    // Use readFile from the xlsx default export
    const workbook = xlsx.readFile('spreadsheet.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(data); 
  } catch (error) {
    console.error("Error reading Excel file:", error);
  }
}

readExcelData();
