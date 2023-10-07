const express = require("express");
const http = require("http");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'samplenode',
})

app.get("/", (req, res) => {

    res.sendFile(__dirname + "/authentication/index.html");

})

app.get("/chat", (req, res) => {

    res.sendFile(__dirname + "/client/index.html");

})

app.post("/doLogin", (req, res) => {
    let userName = req.body.username;
    let passWord = req.body.password;

    let query = 'SELECT * FROM `users` WHERE username = ? AND password = ?';

    db.query(query, [userName, passWord],function (err, result) {
        if (!err) {
            if(result.length > 0){
                let userId = result[0].user_id;
                res.redirect(`/chat?id=${userId}`);
            }else{
                res.status(401).send("Invalid username or password!");
            }
        } else {
            console.error(err);
            res.status(500).send("Error occurred while Login.");
        }
    });
})

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/authentication/register.html");
})

app.post("/insertUser", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let query = "INSERT INTO users(`username`, `password`) VALUES(?, ?)";

    db.query(query, [username, password], function (err, result) {
        if (!err) {
            
            const newUser = {
              username: username,
            };
      
            io.emit("add Users", newUser);
      
            res.sendFile(__dirname + "/authentication/register.html");
          } else {
            console.error(err);
            res.status(500).send("Error occurred while registering.");
          }
    });
});

app.get("/chat-data/:id", (req, res) => {
    let userId = req.params.id;

    let query = "SELECT * FROM users WHERE user_id != ?";

    db.query(query, [userId], function (err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.json(result);
        }
    });
});


io.on("connection", (socket) => {

    socket.on("chat message", (message) => {

        io.emit("chat message", message);

    });

    socket.on("add Users", (add) => {

        io.emit("add Users", add);

    });

    socket.on("disconnect", () => {

        console.log("disconnected");

    });
});

server.listen(4000, () => {
    console.log("Server listening on PORT 4000");
});