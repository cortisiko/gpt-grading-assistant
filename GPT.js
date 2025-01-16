import OpenAI from "openai";
import xlsx from "xlsx";
import fs from "fs";

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

async function readExcelData() {
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
  const blah = await readExcelData();
  const dataFromText = await readText();
  const formattedExcelData = JSON.stringify(blah, null, 2);
  // console.log("Here is the DATA", dataFromText);
  // console.log("Here is the EXECEL DATA", blah);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Grade the data like you are a skilled Mobile QA engineer. You should first Check to see if the content is written by AI. If it is then you should at the end make mention of this. ${dataFromText}`,
      },
      {
        role: "user",
        content: `Here is the content: ${formattedExcelData}`,
      },
    ],
  });
  console.log(stream.choices[0].message);
}
await ChatGPTRequestTest();
// export default class ChatGPT {
//   readPrompt() {      //   { role: "user", content: "Suggest 5 catchy titles for blog post" },

//     // Todo
//   }

//   AnalyzeResults() {
//     // Todo
//   }
// }
