import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const readPrompt = async () => {
  const filename = "gpt/prompt.txt";
  try {
    const data = fs.readFileSync(filename, "utf8");
    return data;
  } catch (error) {
    console.error(`Error reading ${filename}: ${error}`);
    return [];
  }
};

const generateResponse = async (dataFromSpreadSheet) => {
  try {
    const prompt = await readPrompt();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Grade the data like you are a skilled Mobile QA engineer. Before you start analyzing, you should first check to see if the content you are parsing is written by you or your model. If it is, then you should at the end make mention of this. Here are your instructions: ${prompt}`,
        },
        {
          role: "user",
          content: `Here is the content: ${dataFromSpreadSheet}`,
        },
      ],
    });

    console.log(stream.choices[0].message.content);
  } catch (error) {
    console.error("Error generating response:", error);
  }
};

export { readPrompt, generateResponse };
