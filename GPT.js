import OpenAI from "openai";
import xlsx from "xlsx";
import fs from "fs";
import { generateResponse } from "./gpt/GPTAssessment.js";
import { readExcelData } from "./file-operations/ParseExcel.js";
import { parseAndCreatePDFs } from "./file-operations/ExportToPDF.js";
async function readText() {
  const filename = "data.txt";
  try {
    let data = fs.readFileSync(filename, "utf8");
    return data;
  } catch (error) {
    console.error(`Error reading ${filename}: ${error}`);
    return [];
  }
}

async function readExcelDatas() {
  try {
    // Use readFile from the xlsx default export
    const workbook = xlsx.readFile("spreadsheet.xlsx");
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // console.log(data);
    // let bam = getResponseData(data);
    // console.log(bam);
    return data;
  } catch (error) {
    console.error("Error reading Excel file:", error);
  }
}

async function ChatGPTRequestTest() {
  const blah = await readExcelDatas();
  const dataFromText = await readText();
  const formattedExcelData = JSON.stringify(blah, null, 2);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Grade the data like you are a skilled Mobile QA engineer. Before you start analyzing, you should first Check to see if the content you are parsing is written by you or your model. If it is then you should at the end make mention of this. Here is the data ${dataFromText}`,
      },
      {
        role: "user",
        content: `Here is the content: ${formattedExcelData}`,
      },
    ],
  });
  console.log(stream.choices[0].message);
}
// await ChatGPTRequestTest();

const data = await readExcelData();
let aiResponse = await generateResponse(data);
const pdf = await parseAndCreatePDFs(aiResponse);
