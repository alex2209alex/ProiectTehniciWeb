const express = require("express");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass");
const path = require("path");
const ejs = require("ejs");
const {Client} = require("pg");

//const client = new Client({database: "Calculatoare Noi si Vechi", user: "alex", password: "alex", host: "localhost", port: 5433});
const client = new Client({database: "ddgcm5k83pto4u", user: "bqvcfvzfurpggw", password: "55e02f988384cdbae8b5e1ed9d139a34080cd3fe64b2cb82a1505e67f80f670c", host: "ec2-44-199-143-43.compute-1.amazonaws.com", port: "5432", ssl: {rejectUnauthorized: false}});
client.connect();

let categorii = [];
client.query("SELECT * FROM unnest(enum_range(null::categ_produse))", function(err, rezCateg) {
    for(const elem of rezCateg.rows) {
        categorii.push(elem.unnest);
    }
});
let tipuri = [];
client.query("SELECT * FROM unnest(enum_range(null::tipuri_produse))", function(err, rezTip) {
    for(const elem of rezTip.rows) {
        tipuri.push(elem.unnest);
    }
});
let producatori = [];
client.query("SELECT DISTINCT producator from produse", function(err, rezProd) {
    for(const elem of rezProd.rows) {
        producatori.push(elem.producator);
    }
});

let random_6_13 = 6 + Math.floor(Math.random() * 8);
let random_6_12_even = random_6_13;
if(random_6_13 % 2 === 1) {
    random_6_12_even -= 1;
}
let obErori, obImagini;

const app = express();
app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));

app.get(["/", "/index", "/home"], function(req, res) {
    res.render("pagini/index", {ip: req.ip, imagini: obImagini.imagini, categorii: categorii});
    res.end();
});

app.get("/despre", function(req,res) {
    res.render("pagini/despre", {categorii: categorii});
    res.end();
});

app.get("/produse", function(req, res) {
    let selectSql = "SELECT * FROM produse WHERE 1=1 ";
    if(req.query.categ) {
        selectSql += `AND categorie = '${req.query.categ}' `;
    }
    // Cuvant cheie in descriere
    if(req.query.cc) {
        selectSql += `AND LOWER(descriere) LIKE '%${req.query.cc}%' `;
    }
    // Pret produs
    if(req.query.mi) {
        selectSql += `AND pret >= ${req.query.mi} `;
    }
    if(req.query.ma) {
        selectSql += `AND pret <= ${req.query.ma} `;
    }
    // Tip produs
    if(req.query.tp) {
        selectSql += `AND tip_produs = '${req.query.tp}' `;
    }
    // Returnare
    if(req.query.ret) {
        selectSql += `AND returnare = ${req.query.ret} `;
    }
    // Noutati
    if(req.query.no) {
        selectSql += `AND data_adaugare >= '19 apr 2022' `;
    }
    // Nume
    if(req.query.nu) {
        selectSql += `AND LOWER(nume) LIKE '${req.query.nu}%' `;
    }
    // Reducere
    if(req.query.mired) {
        selectSql += `AND reducere >= ${req.query.mired} `;
    }
    if(req.query.mared) {
        selectSql += `AND reducere <= ${req.query.mared} `;
    }
    // Producatori
    if(req.query.pro) {
        if(typeof req.query.pro !== "string") {
            let stringProducatori = `'${req.query.pro[0]}'`;
            for(let i = 1; i < req.query.pro.length; ++i) {
                stringProducatori += `, '${req.query.pro[i]}'`;
            }
            selectSql += `AND LOWER(producator) IN (${stringProducatori}) `;
        }
        else {
            let stringProducatori = `'${req.query.pro}'`;
            selectSql += `AND LOWER(producator) LIKE ${stringProducatori} `;
        }
    }
    // Sortare
    if(req.query.sort) {
        if(req.query.sort === "cresc") {
            selectSql += `ORDER BY nume, reducere / pret `;
        }
        else {
            selectSql += `ORDER BY nume DESC, reducere / pret DESC`;
        }
    }
    client.query(selectSql, function(err, rezQuery) {
        if(rezQuery && rezQuery.rowCount) {
            res.render("pagini/produse", {tipuri:tipuri, producatori: producatori, produse: rezQuery.rows, categorii: categorii, query: req.query});
        }
        else {
            randeazaEroare(res,1, 'Nu sunt produse cu selectia cautata', 'Nu avem produse de tipul descris.','/resurse/imagini/erori/404.webp')
        }
    });
});

app.get("/produs/:id", function(req, res) {
    client.query(`SELECT * FROM produse WHERE id = ${req.params.id}`, function(err, rezQuery) {
        if(rezQuery.rows.length === 1) {
            res.render("pagini/produs", {prod: rezQuery.rows[0], categorii: categorii});
        }
        else {
            randeazaEroare(res,404);
        }
    });
});

app.get("*/galerie_animata.css", function(req, res) {
    const sirScss = fs.readFileSync(__dirname + "/resurse/scss/galerie_animata.scss").toString("utf8");
    const rezScss = ejs.render(sirScss,{nrImagini: random_6_12_even, categorii: categorii});
    const caleScss = __dirname + "/temp/galerie_animata.scss";
    fs.writeFileSync(caleScss,rezScss);
    let rezCompilare;
    try {
        rezCompilare = sass.compile(caleScss, {sourceMap:true});
        const caleCss = __dirname + "/temp/galerie_animata.css";
        fs.writeFileSync(caleCss, rezCompilare.css);
        res.setHeader("Content-Type", "text/css");
        res.sendFile(caleCss);
    }
    catch(err) {
        console.log(err);
        randeazaEroare(res, "Ai busit ceva la site");
    }
    random_6_13 = 6 + Math.floor(Math.random() * 8);
    random_6_12_even = random_6_13;
    if(random_6_13 % 2 === 1) {
        random_6_12_even -= 1;
    }
});

app.get("*/galerie_animata.css.map",function(req, res){
    res.sendFile(path.join(__dirname,"temp/galerie_animata.css.map"));
});

app.get("/galerie_animata", function(req, res) {
    res.render("pagini/galerie_animata", {imagini: obImagini.imagini, numarImagini: random_6_12_even, categorii: categorii}) ;
    res.end();
});

app.get("/galerie_statica", function(req, res) {
    res.render("pagini/galerie_statica", {imagini: obImagini.imagini, categorii: categorii});
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
    const eroare = obErori.erori.find(function(elem) {
        return elem.identificator === identificator;
    });
    titlu = titlu || (eroare && eroare.titlu) || "Titlu eroare custum";
    text = text || (eroare && eroare.text) || "Text eroare custum";
    imagine = imagine || (eroare && (obErori.cale_baza + "/" + eroare.imagine)) || "Imagine eroare custum";
    if(eroare && eroare.status)
        res.status(eroare.identificator);
    res.render("pagini/eroare_generala", {titlu: titlu, text: text, imagine: imagine, categorii: categorii});
    res.end();
}

const s_port = process.env.PORT || 8080;
app.listen(s_port);
console.log("A pornit!");