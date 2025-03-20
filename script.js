let listenersGradFRight = [];
let listenersGradFLeft = [];

function gradFFocus() {
    let gradFEl = document.getElementsByClassName('gradF');
    let n = 2;
    let m = gradFEl.length/2;
    for (let i=0;i<n;i++) {
        for (let j=0;j<m;j++){
            gradFEl[i*m+j].onkeydown = function(event) {
                if (event.key === "ArrowRight" && gradFEl[i*m+j].selectionStart == gradFEl[i*m+j].value.length) {
                    if (i*m+j+1 != gradFEl.length)
                    gradFEl[i*m+j+1].focus();
                }
                if (event.key === "ArrowLeft" && gradFEl[i*m+j].selectionStart == 0) {
                    if (i*m+j != 0)
                    gradFEl[i*m+j-1].focus();
                }
                if (event.key === "ArrowUp") {
                    if (i != 0)
                    gradFEl[(i-1)*m+j].focus();
                    if (i == 0 && j != 0)
                    gradFEl[(n-1)*m+j-1].focus();
                }
                if (event.key === "ArrowDown") {
                    if (i != n-1)
                    gradFEl[(i+1)*m+j].focus();
                    if (i == n-1 && j != m-1)
                    gradFEl[j+1].focus();
                }
            }
        }
    }
    /*
    for (let i = 0; i < gradFEl.length - 1; i++) {
        gradFEl[i].removeEventListener('keydown', listenersGradFRight[i]);
        gradFEl[i + 1].removeEventListener('keydown', listenersGradFLeft[i]);
    }
    listenersGradFLeft = [];
    listenersGradFRight = [];
    for (let i = 0; i < gradFEl.length - 1; i++) {
        listenersGradFRight.push(function (event) {
            if (event.key === "ArrowRight" && gradFEl[i].selectionStart == gradFEl[i].value.length) gradFEl[i + 1].focus();
        });
        gradFEl[i].addEventListener('keydown', listenersGradFRight[listenersGradFRight.length - 1]);
    }
    for (let i = 1; i < gradFEl.length; i++) {
        listenersGradFLeft.push(function (event) {
            if (event.key === "ArrowLeft" && gradFEl[i].selectionStart == 0) gradFEl[i - 1].focus();
        });
        gradFEl[i].addEventListener('keydown', listenersGradFLeft[listenersGradFLeft.length - 1]);
    }
    */
}
gradFFocus();

function constraintsFocus() {
    let constraintsEl = document.querySelectorAll('.constraint div input');
    let n = parseInt(document.getElementById("numConstraints").value);
    let m = parseInt(document.getElementById("numVars").value)+1;
    if (isNaN(n) || isNaN(m) || n<1 || m<1) {
        document.getElementById("result").innerHTML = "Некорректное заполнение числа ограничений или числа переменных";
        return;
    } else document.getElementById("result").innerHTML = "";
    for (let i=0;i<n;i++) {
        for (let j=0;j<m;j++){
            constraintsEl[i*m+j].onkeydown = function(event) {
                if (event.key === "ArrowRight" && constraintsEl[i*m+j].selectionStart == constraintsEl[i*m+j].value.length) {
                    if (i*m+j+1 != constraintsEl.length)
                        constraintsEl[i*m+j+1].focus();
                }
                if (event.key === "ArrowLeft" && constraintsEl[i*m+j].selectionStart == 0) {
                    if (i*m+j != 0)
                        constraintsEl[i*m+j-1].focus();
                }
                if (event.key === "ArrowUp") {
                    if (i != 0)
                        constraintsEl[(i-1)*m+j].focus();
                    if (i == 0 && j != 0)
                        constraintsEl[(n-1)*m+j-1].focus();
                }
                if (event.key === "ArrowDown") {
                    if (i != n-1)
                        constraintsEl[(i+1)*m+j].focus();
                    if (i == n-1 && j != m-1)
                        constraintsEl[j+1].focus();
                }
            }
        }
    }
}
constraintsFocus();

document.getElementById('numConstraints').oninput = function () {
    let p = parseInt(document.getElementById('numConstraints').value);
    if (isNaN(p) || p<1) {
        document.getElementById("result").innerHTML = "Некорректное заполнение числа ограничений";
        return;
    } else document.getElementById("result").innerHTML = "";
    let constraintsWrap = document.getElementById('constraintsWrap');
    if (constraintsWrap.children.length<p) {
        let constraintEl = document.querySelector('.constraint')
        let constraintElCopy = document.createElement('div');
        constraintElCopy.innerHTML = constraintEl.innerHTML;
        constraintElCopy.classList.add('constraint');
        while (p != constraintsWrap.children.length) {
            constraintsWrap.insertAdjacentHTML('beforeend', constraintElCopy.outerHTML);
            constraintsWrap.children[constraintsWrap.children.length-1].querySelectorAll('input').forEach(function (element) {
                element.value="";
            });
        }
    }
    else {
        while (p != constraintsWrap.children.length) {
            constraintsWrap.lastChild.remove();
        }
    }
    constraintsFocus();
}


document.getElementById('numVars').oninput = function () {
    let p = parseInt(document.getElementById('numVars').value);
    if (isNaN(p) || p<1) {
        document.getElementById("result").innerHTML = "Некорректное заполнение числа переменных";
        return;
    } else document.getElementById("result").innerHTML = "";


    let gradFWrap = document.getElementById('gradFWrap');
    if (gradFWrap.children.length-1<p) {
        let gradFdivEl = gradFWrap.querySelector('.gradFdiv');
        let gradFdivElCopy = document.createElement('div');
        gradFdivElCopy.innerHTML = gradFdivEl.innerHTML;
        gradFdivElCopy.classList.add('gradFdiv');
        let values = [];
        for (let i=0;i<gradFWrap.children.length;i++) {
            values.push(gradFWrap.children[i].querySelector('input').value);
        }
        while (p != gradFWrap.children.length-1)
            gradFWrap.innerHTML += gradFdivElCopy.outerHTML;
        for (let i=0;i<gradFWrap.children.length;i++) {
            if (i<values.length) gradFWrap.children[i].innerHTML = `<input class="gradF" placeholder="0" value="${values[i]}">*x${i+1}+`;
            else gradFWrap.children[i].innerHTML = `<input class="gradF" placeholder="0">*x${i+1}+`;
            if (i==values.length-1) gradFWrap.children[i].innerHTML = `<input class="gradF" placeholder="0">*x${i+1}+`;
            if (i==gradFWrap.children.length-1) gradFWrap.children[i].innerHTML = `<input class="gradF" placeholder="0" value="${values[values.length-1]}">`;
        }
    }
    else {
        while (p != gradFWrap.children.length-1) {
            gradFWrap.children[gradFWrap.children.length-2].remove();
        }
    }

    let gradFZnamWrap = document.getElementById('gradFZnamWrap');
    if (gradFZnamWrap.children.length-1<p) {
        let gradFdivEl = gradFZnamWrap.querySelector('.gradFdiv');
        let gradFdivElCopy = document.createElement('div');
        gradFdivElCopy.innerHTML = gradFdivEl.innerHTML;
        gradFdivElCopy.classList.add('gradFdiv');
        let values = [];
        for (let i=0;i<gradFZnamWrap.children.length;i++) {
            values.push(gradFZnamWrap.children[i].querySelector('input').value);
        }
        while (p != gradFZnamWrap.children.length-1)
        gradFZnamWrap.innerHTML += gradFdivElCopy.outerHTML;
        for (let i=0;i<gradFZnamWrap.children.length;i++) {
            if (i<values.length) gradFZnamWrap.children[i].innerHTML = `<input class="gradF" placeholder="0" value="${values[i]}">*x${i+1}+`;
            else gradFZnamWrap.children[i].innerHTML = `<input class="gradF" placeholder="0">*x${i+1}+`;
            if (i==values.length-1) gradFZnamWrap.children[i].innerHTML = `<input class="gradF" placeholder="0">*x${i+1}+`;
            if (i==gradFZnamWrap.children.length-1) gradFZnamWrap.children[i].innerHTML = `<input class="gradF" placeholder="0" value="${values[values.length-1]}">`;
        }
    }
    else {
        while (p != gradFZnamWrap.children.length-1) {
            gradFZnamWrap.children[gradFZnamWrap.children.length-2].remove();
        }
    }
    
    gradFFocus();

    let constraintsWrap = document.getElementById('constraintsWrap');
    for (let j=0;j<constraintsWrap.children.length;j++) {
        if (constraintsWrap.children[j].children.length-2<p) {
            let constraintEl = document.querySelector('.constraintVar');
            let constraintElCopy = [];
            for (let i=0;i<p-constraintsWrap.children[j].children.length+2;i++) {
                constraintElCopy[i] = document.createElement('div');
                constraintElCopy[i].innerHTML = constraintEl.innerHTML;
                constraintElCopy[i].classList.add('constraintVar');
            }
            let values = [];
            for (let i=0;i<constraintsWrap.children[j].children.length-2;i++) {
                values.push(constraintsWrap.children[j].children[i].querySelector('input').value);
            }
            while (p != constraintsWrap.children[j].children.length-2) {
                constraintsWrap.children[j].insertBefore(constraintElCopy.splice(0,1)[0], constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-2]);
            }
            for (let i=0;i<constraintsWrap.children[j].children.length-2;i++) {
                if (i<values.length) constraintsWrap.children[j].children[i].innerHTML = `<input class="constraintVarInp" placeholder="0" value="${values[i]}">*x${i+1}+`;
                else constraintsWrap.children[j].children[i].innerHTML = `<input class="constraintVarInp" placeholder="0">*x${i+1}+`;
            }
            constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].innerHTML = constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].innerHTML.slice(0,constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].innerHTML.length-1);
        }
        else {
            while (p != constraintsWrap.children[j].children.length-2) {
                constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].remove();
            }
            constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].innerHTML = constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].innerHTML.slice(0,constraintsWrap.children[j].children[constraintsWrap.children[j].children.length-3].innerHTML.length-1);
        }
    }
    constraintsFocus();
}