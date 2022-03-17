const express = require("express");
const fs = require("fs");
const sharp = require("sharp");

app = express();
app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname+"/resurse"));

app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index");
    res.end();
});

app.get("/*.ejs", function(req, res){
    res.status(403).render("pagini/403");
    res.end();
})

app.get("/*", function(req, res){
    res.render("pagini"+req.url, function(err, rezRender) {
        if(err) {
            if(err.message.includes("Failed to lookup view")){
                console.log(err);
                res.status(404).render("pagini/404");
            }
            else {
                res.render("pagini/eroare_generala");
            }
        }
        else {
            console.log(rezRender);
            res.send(rezRender);
        }
    });
    res.end();
});

app.listen(8080);
console.log("A pornit!");