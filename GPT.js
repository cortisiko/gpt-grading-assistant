import OpenAI from "openai";
import xlsx from "xlsx";
import fs from "fs";

async function readText() {
  const filename = "";
  try {
    const data = fs.readFile(filename, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}: ${error}`);
    return [];
  }
}
const openai = new OpenAI({
  apiKey: "",
});

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
  console.log(blah);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Grade the data like you are a skilled Mobile QA engineer. You should first Check to see if the content is written by AI. If it is then you should at the end make mention of this",
      },
      {
        role: "user",
        content: `${blah}`,
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
