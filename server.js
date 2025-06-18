import express from 'express'

import multer from 'multer';
import fs from 'fs'
import {GoogleGenerativeAI} from '@google/generative-ai';
import dotenv from 'dotenv'
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static('public'));

const uploads = multer({dest: 'uploads/'})

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: ISSUE WITH API KEY")
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/get", uploads.single("file"), async (req, res)=> {
    const userInput = req.body.msg;
    const file = req.file;

    try {
        const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

        let prompt = [userInput];
        if (file) {
            const fileData = fs.readFileSync(file.path);
            const image = {
                inlineData: {
                    data: fileData.toString('base64'),
                    mimeType: file.mimetype,
                },
            };
            prompt.push(image)
        } 

        const response = await model.generateContent(prompt);
        console.log(response);
        res.send(response.response.text());
    } catch (error) {
        console.error('Error response idont know why:', error);
        res.status(error.status || 500).send('An error Occured while generating response')
    } finally {
        if (file) {
            file.unlinkSync(file.path);
        }
    }
})

app.listen(PORT, ()=> {
    console.log(`Server started on: http://localhost:${PORT}`)
})