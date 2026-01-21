require("dotenv").config();
console.log("server.js started");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const blogsRouter = require("./routes/blogs")
const app  = express();

app.use(cors());
app.use(express.json());
app.use("/blogs", blogsRouter);
app.use(express.static(path.join(__dirname, "public")));


app.get("health", (req, res) => res.json({status: "ok"}));
async function start(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log('Server running on http://localhost:${PORT}');
        });
    } catch (err){
        console.error("Fauled to start: ", err.message);
        process.exit(1);
    }
}

start();