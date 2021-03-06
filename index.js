const express = require("express");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass");
const path = require("path");
const ejs = require("ejs");
const {Client} = require("pg");
const formidable = require('formidable');
const crypto = require('crypto');
const session = require('express-session');

const client = new Client({database: "Calculatoare Noi si Vechi", user: "alex", password: "alex", host: "localhost", port: 5433});
/*const client = new Client({
    database: "ddgcm5k83pto4u",
    user: "bqvcfvzfurpggw",
    password: "55e02f988384cdbae8b5e1ed9d139a34080cd3fe64b2cb82a1505e67f80f670c",
    host: "ec2-44-199-143-43.compute-1.amazonaws.com",
    port: "5432",
    ssl: {
        rejectUnauthorized: false
    }
});*/
client.connect();

const obiectGlobal = {obImagini: null, obErori: null, categorii: [], pretMinim: null, pretMaxim: null};

client.query("SELECT * FROM unnest(enum_range(null::categ_produse))", function(err, rezCateg) {
    for(const elem of rezCateg.rows) {
        obiectGlobal.categorii.push(elem.unnest);
    }
});
client.query("SELECT MIN(pret) FROM produse", function(err, rezPretMinim) {
    obiectGlobal.pretMinim = rezPretMinim.rows[0].min;
});
client.query("SELECT MAX(pret) FROM produse", function(err, rezPretMaxim) {
    obiectGlobal.pretMaxim = rezPretMaxim.rows[0].max;
});


let random_6_13 = 6 + Math.floor(Math.random() * 8);
let random_6_12_even = random_6_13;
if(random_6_13 % 2 === 1) {
    random_6_12_even -= 1;
}

const app = express();

app.use(session({ // aici se creaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
}));

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));

app.use("/*", function(req, res, next) {
    res.locals.utilizator = req.session.utilizator;
    next();
});

app.get(["/", "/index", "/home"], function(req, res) {
    res.render("pagini/index", {ip: req.ip, imagini: obiectGlobal.obImagini.imagini, categorii: obiectGlobal.categorii});
    res.end();
});

app.get("/despre", function(req,res) {
    res.render("pagini/despre", {categorii: obiectGlobal.categorii});
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
    client.query(selectSql, function(err, rezQuery) {
        if(rezQuery && rezQuery.rowCount) {
            res.render("pagini/produse", {tipuri:tipuri, producatori: producatori, produse: rezQuery.rows, categorii: obiectGlobal.categorii, query: req.query, pretMinim: obiectGlobal.pretMinim, pretMaxim: obiectGlobal.pretMaxim});
        }
        else {
            randeazaEroare(res,1, 'Nu sunt produse cu selectia cautata', 'Nu avem produse de tipul descris.','/resurse/imagini/erori/404.webp')
        }
    });
});

app.get("/produs/:id", function(req, res) {
    client.query(`SELECT * FROM produse WHERE id = ${req.params.id}`, function(err, rezQuery) {
        if(rezQuery.rows.length === 1) {
            res.render("pagini/produs", {prod: rezQuery.rows[0], categorii: obiectGlobal.categorii});
        }
        else {
            randeazaEroare(res,404);
        }
    });
});

app.get("*/galerie_animata.css", function(req, res) {
    const sirScss = fs.readFileSync(__dirname + "/resurse/scss/galerie_animata.scss").toString("utf8");
    const rezScss = ejs.render(sirScss,{nrImagini: random_6_12_even, categorii: obiectGlobal.categorii});
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
    res.render("pagini/galerie_animata", {imagini: obiectGlobal.obImagini.imagini, numarImagini: random_6_12_even, categorii: obiectGlobal.categorii}) ;
    res.end();
});

app.get("/galerie_statica", function(req, res) {
    res.render("pagini/galerie_statica", {imagini: obiectGlobal.obImagini.imagini, categorii: obiectGlobal.categorii});
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

//-------------------------------------------------------------Utilizatori-------------------------------------------------------------

//cod luat de pe https://www.programiz.com/javascript/examples/generate-random-strings#:~:text=random()%20method%20is%20used,a%20random%20character%20is%20generated.
function generateString(length) {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.post("/inreg", function(req, res) {
    const formular = new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFisier) {
        console.log(campuriText);
        const salt = generateString(16);
        const parolaCriptata = crypto.scryptSync(campuriText.parola, salt, 64).toString("hex");
        let comandaInserare;
        if(campuriText.ocupatie != "default") {
            comandaInserare = `INSERT INTO utilizatori (username, nume, prenume, parola, email, culoare_chat, salt, ocupatie) VALUES ('${campuriText.username}', '${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}', '${salt}', '${campuriText.ocupatie}')`;
        }
        else {
            comandaInserare = `INSERT INTO utilizatori (username, nume, prenume, parola, email, culoare_chat, salt) VALUES ('${campuriText.username}', '${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}', '${salt}')`;
        }
        client.query(comandaInserare, function(err, rezInserare) {
            if(err)
                console.log(err);
        });
        res.render("pagini/inregistrare", {raspuns: "Datele au fost introduse", categorii: obiectGlobal.categorii});
    });
});

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.locals.utilizator = null;
    res.render("pagini/logout", {categorii: obiectGlobal.categorii});
    res.end();
});

app.post("/login", function(req, res) {
    const formular = new formidable.IncomingForm();
    formular.parse(req, function(err, campuriText, campuriFisier) {
        console.log(campuriText);
        const username = campuriText.username;
        const slectSalt = `SELECT salt FROM utilizatori WHERE username='${username}'`
        let salt;
        client.query(slectSalt, function(err,rezSelectSalt) {
            if(err)
                console.log(err);
            salt = rezSelectSalt.rows[0].salt;
            const parolaCriptata = crypto.scryptSync(campuriText.parola, salt, 64).toString("hex");
            const querySelect = `SELECT * FROM utilizatori WHERE username='${username}' AND parola='${parolaCriptata}'`;
            client.query(querySelect, function(err, rezSelect) {
                if(err)
                    console.log(err);
                else {
                    if(rezSelect.rows.length == 1) { //daca am utilizator cu date corecte
                        req.session.utilizator={
                            nume: rezSelect.rows[0].nume,
                            prenume: rezSelect.rows[0].prenume,
                            username: rezSelect.rows[0].username,
                            email: rezSelect.rows[0].email,
                            culoare_chat: rezSelect.rows[0].culoare_chat,
                            rol: rezSelect.rows[0].rol,
                            ocupatie: rezSelect.rows[0].ocupatie
                        }
                        res.redirect("/index");
                    }
                }
            });
        });
    });
});

app.get("/inregistrare", function(req, res) {
   res.render("pagini/inregistrare", {categorii: obiectGlobal.categorii});
   res.end();
});

app.get("/ceva", function(req,res) {
   console.log(req.session.utilizator);
   res.end();
});

//-------------------------------------------------------------------------------------------------------------------------------------

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
    obiectGlobal.obImagini = JSON.parse(buf);
    for(let imag of obiectGlobal.obImagini.imagini) {
        let nume_imag;
        [nume_imag, ] = imag.cale_fisier.split(".");
        let dim_mic = 150;
        imag.mic = `${obiectGlobal.obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp`;
        imag.mare = `${obiectGlobal.obImagini.cale_galerie}/${imag.cale_fisier}`;
        if (!fs.existsSync(imag.mic))
            sharp(__dirname+"/" + imag.mare).resize(dim_mic).toFile(__dirname + "/" + imag.mic);
        let dim_mediu = 300;
        imag.mediu = `${obiectGlobal.obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png`;
        if (!fs.existsSync(imag.mediu))
            sharp(__dirname + "/" + imag.mare).resize(dim_mediu).toFile(__dirname + "/" + imag.mediu);
    }
}
creeazaImagini();

function creeazaErori() {
    const buf = fs.readFileSync(__dirname + "/resurse/json/erori.json").toString("utf8");
    obiectGlobal.obErori = JSON.parse(buf);
}
creeazaErori();

function randeazaEroare(res, identificator, titlu, text, imagine) {
    const eroare = obiectGlobal.obErori.erori.find(function(elem) {
        return elem.identificator === identificator;
    });
    titlu = titlu || (eroare && eroare.titlu) || "Titlu eroare custum";
    text = text || (eroare && eroare.text) || "Text eroare custum";
    imagine = imagine || (eroare && (obiectGlobal.obErori.cale_baza + "/" + eroare.imagine)) || "Imagine eroare custum";
    if(eroare && eroare.status)
        res.status(eroare.identificator);
    res.render("pagini/eroare_generala", {titlu: titlu, text: text, imagine: imagine, categorii: obiectGlobal.categorii});
    res.end();
}

const s_port = process.env.PORT || 8080;
app.listen(s_port);
console.log("A pornit!");