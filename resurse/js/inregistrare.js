window.onload = function(){
    var formular = document.getElementById("form_inreg");
    if(formular){
        formular.onsubmit= function(){
            let eroare = "Nu ati fost inregistrat.";
            let valid = true;

            const nume = document.getElementById("inp-nume").value;
            if(!nume) {
                eroare += "Nu ati introdus \"numele\".";
                valid = false;
            }
            if(nume && !/^[\s-A-Za-z]*$/.test(nume)) {
                eroare += "\"Numele\" poate contine doar litere si \"-\" si spatii.";
                valid = false;
            }

            const prenume = document.getElementById("inp-prenume").value;
            if(!prenume) {
                eroare += "Nu ati introdus \"prenume\".";
                valid = false;
            }
            if(prenume && !/^[\s-A-Za-z]*$/.test(prenume)) {
                eroare += "\"Prenume\" poate contine doar litere si \"-\" si spatii.";
                valid = false;
            }

            const username = document.getElementById("inp-username").value;
            if(!username) {
                eroare += "Nu ati introdus \"username\".";
                valid = false;
            }
            if(username && !/^[A-Za-z0-9]*$/.test(username.value)) {
                eroare += "\"Username\" poate contine doar litere si cifre.";
                valid = false;
            }

            if(document.getElementById("parl").value !== document.getElementById("rparl").value){
                eroare += "Nu ati introdus acelasi sir pentru campurile \"parola\" si \"reintroducere parola\".";
                valid = false;
            }

            const raspuns = document.createElement("div");
            raspuns.innerHTML = eroare;
            raspuns.style.display = "block";
            raspuns.style.position = "absolute";
            raspuns.style.backgroundColor = "blue";
            raspuns.style.top = "0";
            raspuns.style.alignContent = "center";
            raspuns.style.color = "white";
            raspuns.style.height = "100%";
            raspuns.style.fontSize = "50px"
            const main = document.getElementsByTagName("main")[0];
            main.appendChild(raspuns);
            setTimeout(() => {
                raspuns.remove();
            }, 4000);
            return valid;
        }
    }
}