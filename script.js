// ======== LINK DO MODELO ========
const URL = "https://teachablemachine.withgoogle.com/models/d1OE97UJY/";

// ======== VARIÁVEIS ========
let model;
let webcam;
let labelContainer;
let maxPredictions;

let port = null;
let writer = null;

let ultimaClasse = "";

// ===============================
// CONECTAR ARDUINO
// ===============================
async function connectArduino() {

    try {

        port = await navigator.serial.requestPort();

        await port.open({
            baudRate: 9600
        });

        writer = port.writable.getWriter();

        alert("Arduino conectado!");

    } catch (erro) {

        console.log(erro);

        alert("Não foi possível conectar ao Arduino.");

    }

}

// ===============================
// ENVIAR DADOS
// ===============================
async function enviarArduino(valor) {

    if (!writer) return;

    const encoder = new TextEncoder();

    await writer.write(encoder.encode(valor));

}

// ===============================
// INICIAR
// ===============================
async function init() {

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);

    maxPredictions = model.getTotalClasses();

    webcam = new tmImage.Webcam(320,320,true);

    await webcam.setup();

    await webcam.play();

    document.getElementById("webcam-container").innerHTML = "";

    document.getElementById("webcam-container").appendChild(webcam.canvas);

    labelContainer = document.getElementById("label-container");

    labelContainer.innerHTML = "";

    for(let i=0;i<maxPredictions;i++){

        labelContainer.appendChild(document.createElement("div"));

    }

    window.requestAnimationFrame(loop);

}

// ===============================
// LOOP
// ===============================
async function loop(){

    webcam.update();

    await predict();

    window.requestAnimationFrame(loop);

}

// ===============================
// PREDIÇÃO
// ===============================
async function predict() {

    const prediction = await model.predict(webcam.canvas);

    let maior = 0;
    let classe = "";

    for (let i = 0; i < prediction.length; i++) {

        const p = prediction[i];

        labelContainer.childNodes[i].innerHTML =
            p.className + " : " + (p.probability * 100).toFixed(1) + "%";

        if (p.probability > maior) {
            maior = p.probability;
            classe = p.className;
        }
    }

    document.getElementById("resultado").innerHTML =
        "Classe: " + classe +
        "<br>Confiança: " + (maior * 100).toFixed(1) + "%";

    if (maior > 0.90 && classe != ultimaClasse) {

        ultimaClasse = classe;

        let comando = "";

        if (classe == "magica da flor
") {
            comando = "1";
        }
            if (classe == "magica da bola
") {
            comando = "2";
        }
        if (classe == "magica do lenço
") {
            comando = "3";
        }
     }
        if (classe == "recomeço
") {
            comando = "4";
        }



        if (comando != "") {
            console.log("Enviando:", comando);
            await enviarArduino(comando + "\n");
        }
    }
}
