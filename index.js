const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const morgan = require("morgan");

require("dotenv").config();

const router = require('./routes/routing'); 
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: process.env.clientUrl,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    }
});
 
// Database connection establishment
mongoose.connect(process.env.dataBaseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Database connected"))
.catch((err) => console.error("Database connection error:", err));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.clientUrl
}));

app.use("/api", router);

io.on("connect", (socket) => {
    socket.on("new-post", (post) =>{ 
        // console.log(message);
       
        socket.broadcast.emit("new-post", post)
    })
 
}); 







const port = process.env.port || 3000;
http.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
