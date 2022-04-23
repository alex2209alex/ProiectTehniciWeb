// --------------
// Cod luat de pe https://www.youtube.com/watch?v=pTlsnFLiK6c
const inputLeft = document.getElementById("input-left");
const inputRight = document.getElementById("input-right");

const thumbLeft = document.querySelector(".slider .thumb.left");
const thumbRight = document.querySelector(".slider .thumb.right");
const range = document.querySelector(".slider .range");

function setLeftValue() {
    const beforeRange = document.getElementById("before-range");
    const valoareSelectata = document.getElementById("valoare-selectata");
    let _this = inputLeft,
        min = parseFloat(_this.min),
        max = parseFloat(_this.max);
    _this.value = Math.min(parseFloat(_this.value), parseFloat(inputRight.value) - 1);
    beforeRange.textContent = _this.value.toString();
    valoareSelectata.textContent = "(" + _this.value.toString() + ")";
    const procent = (_this.value - min) / (max - min) * 100;

    thumbLeft.style.left = procent + "%";
    range.style.left = procent + "%";
}
setLeftValue();

function setRightValue() {
    const afterRange = document.getElementById("after-range");
    const valoareSelectata = document.getElementById("valoare-selectata");
    let _this = inputRight,
        min = parseFloat(_this.min),
        max = parseFloat(_this.max);
    _this.value = Math.max(parseFloat(_this.value), parseFloat(inputLeft.value) + 1);
    afterRange.textContent = _this.value.toString();
    valoareSelectata.textContent = "(" + _this.value.toString() + ")";
    const procent = (_this.value - min) / (max - min) * 100;
    thumbRight.style.right = (100 -procent) + "%";
    range.style.right = (100 - procent) + "%";
}
setRightValue();


inputLeft.addEventListener("input", setLeftValue);
inputRight.addEventListener("input", setRightValue);

inputLeft.addEventListener("mouseover", function() {
    thumbLeft.classList.add("hover");
});
inputLeft.addEventListener("mouseout", function() {
    thumbLeft.classList.remove("hover");
});
inputLeft.addEventListener("mousedown", function() {
    thumbLeft.classList.add("active");
});
inputLeft.addEventListener("mouseup", function() {
    thumbLeft.classList.remove("active");
});
inputRight.addEventListener("mouseover", function() {
    thumbRight.classList.add("hover");
});
inputRight.addEventListener("mouseout", function() {
    thumbRight.classList.remove("hover");
});
inputRight.addEventListener("mousedown", function() {
    thumbRight.classList.add("active");
});
inputRight.addEventListener("mouseup", function() {
    thumbRight.classList.remove("active");
});
// --------------
function onClickFiltrare() {
    let cuvantCheie = document.getElementById("input-cuvant-cheie").value;
    const tipProdus = document.getElementById("input-tip").value;
    const returnareDa = document.getElementById("input-returnare-da");
    const returnareNu = document.getElementById("input-returnare-nu");
    const noutati = document.getElementById("input-noutati");
    let nume = document.getElementById("input-nume").value;
    const reducere = document.getElementById("input-reducere").options[document.getElementById("input-reducere").selectedIndex].value;
    const producatoriSelect = document.getElementById("input-producatori");
    let minReducere, maxreducere;
    let url = "http://localhost:8080/produse?1=1";
    if(window.location.href.includes("categ=gaming")) {
        url += "&categ=gaming";
    }
    else if(window.location.href.includes("categ=business")) {
        url += "&categ=business";
    }
    else if(window.location.href.includes("categ=home")) {
        url += "&categ=home";
    }
    if(cuvantCheie) {
        cuvantCheie = cuvantCheie.toLowerCase();
        url += `&cc=${cuvantCheie}`;
    }
    if(tipProdus) {
        url += `&tp=${tipProdus}`;
    }
    if(returnareDa.checked) {
        url += "&ret=true";
    }
    else if(returnareNu.checked) {
        url += "&ret=false";
    }
    if(noutati.checked) {
        url += "&no=1";
    }
    if(nume) {
        nume = nume.toLowerCase();
        url += `&nu=${nume}`;
    }
    if(reducere !== "orice") {
        [minReducere, maxreducere] = reducere.split("-");
        url += `&mired=${minReducere}&mared=${maxreducere}`;
    }
    let _this = inputLeft,
        min = parseFloat(_this.min),
        max = parseFloat(_this.max);
    _this.value = Math.min(parseFloat(_this.value), parseFloat(inputRight.value) - 1);

    let _this2 = inputRight,
        min2 = parseFloat(_this2.min),
        max2 = parseFloat(_this2.max);
    _this2.value = Math.max(parseFloat(_this2.value), parseFloat(inputLeft.value) + 1);
    url += `&mi=${_this.value}&ma=${_this2.value}`;
    for(let i = 0; i < producatoriSelect.options.length; ++i) {
        let opt = producatoriSelect.options[i];
        if(opt.selected) {
            let sir = `&pro=${opt.value}`;
            sir = sir.toLowerCase();
            url += sir;
        }
    }
    // Navigare cu filtre
    window.location.href = url;
}

function onClickResetare() {
    let url = "http://localhost:8080/produse?1=1";
    if(window.location.href.includes("categ=gaming")) {
        url += "&categ=gaming";
    }
    else if(window.location.href.includes("categ=business")) {
        url += "&categ=business";
    }
    else if(window.location.href.includes("categ=home")) {
        url += "&categ=home";
    }
    window.location.href = url;
}