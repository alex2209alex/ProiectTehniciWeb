const express = require("express");
const fs = require("fs");
const sharp = require("sharp");

app = express();
app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname+"/resurse"))

app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index");
    res.end();
})

app.listen(8080);
console.log("A pornit!");