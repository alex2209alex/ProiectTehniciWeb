const express = require("express");
const fs = require("fs");
const sharp = require("sharp");

let obErori, obImagini;

const app = express();
app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));

app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index", {ip: req.ip, imagini: obImagini.imagini});
    res.end();
});

app.get("/galerie", function (req, res) {
    res.render("pagini/galerie_statica", {imagini: obImagini.imagini});
    res.end();
});

app.get("/produse", function(req, res) {
    res.end();
});

app.get("/*.ejs", function(req, res) {
    randeazaEroare(res, 403)
    res.end();
});

app.get("/eroare", function(req, res) {
    randeazaEroare(res, 1, "Titlu schimbat");
    res.end();
});

app.get("/*", function(req, res) {
    try {
        res.render("pagini" + req.url, function(err, rezRender) {
            if(err) {
                if(err.message.includes("Failed to lookup view")) {
                    console.log(err);
                    randeazaEroare(res, 404);
                }
                else {
                    randeazaEroare(res, "Ai busit ceva la site");
                }
            }
            else {
                console.log(rezRender);
                res.send(rezRender);
            }
        });
    }
    catch {
        randeazaEroare(res, 404);
    }
    res.end();
});

function creeazaImagini() {
    const buf = fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf8");
    obImagini = JSON.parse(buf);
    for(let imag of obImagini.imagini) {
        let nume_imag;
        [nume_imag, ] = imag.cale_fisier.split(".");
        let dim_mic = 150;
        imag.mic = `${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp`;
        imag.mare = `${obImagini.cale_galerie}/${imag.cale_fisier}`;
        if (!fs.existsSync(imag.mic))
            sharp(__dirname+"/" + imag.mare).resize(dim_mic).toFile(__dirname + "/" + imag.mic);
        let dim_mediu = 300;
        imag.mediu = `${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png`;
        if (!fs.existsSync(imag.mediu))
            sharp(__dirname + "/" + imag.mare).resize(dim_mediu).toFile(__dirname + "/" + imag.mediu);
    }
}
creeazaImagini();

function creeazaErori() {
    const buf = fs.readFileSync(__dirname + "/resurse/json/erori.json").toString("utf8");
    obErori = JSON.parse(buf);
}
creeazaErori();

function randeazaEroare(res, identificator, titlu, text, imagine) {
    const eroare = obErori.erori.find(function (elem) {
        return elem.identificator === identificator;
    });
    titlu = titlu || (eroare && eroare.titlu) || "Titlu eroare custum";
    text = text || (eroare && eroare.text) || "Text eroare custum";
    imagine = imagine || (eroare && (obErori.cale_baza + "/" + eroare.imagine)) || "Imagine eroare custum";
    if(eroare && eroare.status)
        res.status(eroare.identificator);
    res.render("pagini/eroare_generala", {titlu: titlu, text: text, imagine: imagine});
    res.end();
}

app.listen(8080);
console.log("A pornit!");