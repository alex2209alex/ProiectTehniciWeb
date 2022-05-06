window.onload = function () {
    document.getElementById("btn-tema").onclick = function () {
        let tema = localStorage.getItem("tema");
        if(tema) {
            document.body.classList.remove("dark");
            document.getElementsByClassName("fa-sun-o")[0].style.display = "block";
            document.getElementsByClassName("fa-moon-o")[0].style.display = "none";
            localStorage.setItem("tema", "");
        }
        else {
            document.body.classList.add("dark");
            document.getElementsByClassName("fa-sun-o")[0].style.display = "none";
            document.getElementsByClassName("fa-moon-o")[0].style.display = "block";
            localStorage.setItem("tema", "dark");
        }
    }
}