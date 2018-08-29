import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

if (!process.env.PORT) {
    require('dotenv').config();
  }

const port = process.env.PORT || 3001;


const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

app.get('/', (req,res) => res.send("hello world"));

app.listen(port, () => console.log(`express is now listening to port ${port}`));
