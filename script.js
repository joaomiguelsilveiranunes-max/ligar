const URL = "https://teachablemachine.withgoogle.com/models/d1OE97UJY/";

// ===============================
// VARIÁVEIS
// ===============================

let model;
let webcam;
let labelContainer;
let maxPredictions;

let port = null;
let writer = null;

let ultimaClasse = "";
let cameraLigada = false;

// ===============================
// ELEMENTOS DA PÁGINA
// ===============================

const webcamContainer = document.getElementById("webcam-container");
const labelContainerElement = document.getElementById("label-container");
const resultado = document.getElementById("resultado");
const status = document.getElementById("status");

// ===============================
// STATUS
// ===============================

function mostrarStatus(texto) {

    if (status) {
        status.innerHTML = texto;
    }

    console.log(texto);
}

// ===============================
// CONECTAR ARDUINO
// ===============================

async function connectArduino() {

    if (!("serial" in navigator)) {

        alert(
            "Seu navegador não suporta Web Serial.\n\n" +
            "Use o Google Chrome ou Microsoft Edge."
        );

        return;
    }

    try {

        mostrarStatus("🔌 Escolha o Arduino na janela que apareceu...");

        port = await navigator.serial.requestPort();

        await port.open({
            baudRate: 9600
        });

        writer = port.writable.getWriter();

        mostrarStatus("🟢 Arduino conectado!");

        alert("Arduino conectado com sucesso!");

    } catch (erro) {

        console.error("Erro ao conectar Arduino:", erro);

        mostrarStatus("🔴 Erro ao conectar Arduino.");

        alert(
            "Não foi possível conectar ao Arduino.\n\n" +
            "Verifique se ele está conectado ao computador."
        );
    }
}

// ===============================
// DESCONECTAR ARDUINO
// ===============================

async function disconnectArduino() {

    try {

        if (writer) {
            writer.releaseLock();
            writer = null;
        }

        if (port) {
            await port.close();
            port = null;
        }

        mostrarStatus("🟡 Arduino desconectado.");

    } catch (erro) {

        console.error("Erro ao desconectar Arduino:", erro);

    }
}

// ===============================
// ENVIAR DADOS PARA ARDUINO
// ===============================

async function enviarArduino(valor) {

    if (!writer) {

        console.log(
            "Arduino não conectado. Comando não enviado:",
            valor
        );

        return;
    }

    try {

        const encoder = new TextEncoder();

        await writer.write(
            encoder.encode(valor)
        );

        console.log("Arduino recebeu:", valor);

    } catch (erro) {

        console.error(
            "Erro ao enviar para Arduino:",
            erro
        );

        mostrarStatus("🔴 Erro ao enviar comando para o Arduino.");
    }
}

// ===============================
// INICIAR CÂMERA E MODELO
// ===============================

async function init() {

    try {

        mostrarStatus("⏳ Carregando modelo...");

        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(
            modelURL,
            metadataURL
        );

        maxPredictions =
            model.getTotalClasses();

        console.log(
            "Modelo carregado.",
            "Classes:",
            maxPredictions
        );

        // ===============================
        // CONFIGURAR WEBCAM
        // ===============================

        mostrarStatus("📷 Pedindo permissão para usar a câmera...");

        webcam = new tmImage.Webcam(
            320,
            320,
            true
        );

        await webcam.setup();

        await webcam.play();

        cameraLigada = true;

        console.log("Câmera ligada!");

        // ===============================
        // MOSTRAR CÂMERA
        // ===============================

        webcamContainer.innerHTML = "";

        webcamContainer.appendChild(
            webcam.canvas
        );

        // ===============================
        // CRIAR ÁREA DAS CLASSES
        // ===============================

        labelContainerElement.innerHTML = "";

        labelContainer = labelContainerElement;

        for (
            let i = 0;
            i < maxPredictions;
            i++
        ) {

            const div =
                document.createElement("div");

            labelContainer.appendChild(div);
        }

        mostrarStatus("🟢 Câmera funcionando! Modelo pronto.");

        // ===============================
        // COMEÇAR LOOP
        // ===============================

        window.requestAnimationFrame(loop);

    } catch (erro) {

        console.error(
            "Erro ao iniciar câmera/modelo:",
            erro
        );

        cameraLigada = false;

        mostrarStatus(
            "🔴 Não foi possível iniciar a câmera."
        );

        alert(
            "Não foi possível iniciar a câmera.\n\n" +
            "Verifique se você permitiu o acesso à câmera " +
            "e se está usando Chrome ou Edge."
        );
    }
}

// ===============================
// LOOP
// ===============================

async function loop() {

    if (!cameraLigada || !webcam) {
        return;
    }

    webcam.update();

    await predict();

    window.requestAnimationFrame(loop);
}

// ===============================
// PREDIÇÃO
// ===============================

async function predict() {

    if (!model || !webcam) {
        return;
    }

    try {

        const prediction =
            await model.predict(
                webcam.canvas
            );

        let maior = 0;
        let classe = "";

        // ===============================
        // VERIFICAR TODAS AS CLASSES
        // ===============================

        for (
            let i = 0;
            i < prediction.length;
            i++
        ) {

            const p = prediction[i];

            const porcentagem =
                (p.probability * 100).toFixed(1);

            if (
                labelContainer &&
                labelContainer.childNodes[i]
            ) {

                labelContainer.childNodes[i].innerHTML =
                    p.className +
                    " : " +
                    porcentagem +
                    "%";
            }

            if (
                p.probability > maior
            ) {

                maior = p.probability;

                classe = p.className;
            }
        }

        // ===============================
        // MOSTRAR RESULTADO
        // ===============================

        if (resultado) {

            resultado.innerHTML =
                "Classe: " +
                classe +
                "<br>Confiança: " +
                (maior * 100).toFixed(1) +
                "%";
        }

        // ===============================
        // SÓ ACEITA ACIMA DE 90%
        // ===============================

        if (
            maior > 0.90 &&
            classe !== ultimaClasse
        ) {

            ultimaClasse = classe;

            let comando = "";

            // ===============================
            // CLASSES → COMANDOS
            // ===============================

            if (classe === "magica da flor") {

                comando = "1";
            }

            else if (classe === "magica da bola") {

                comando = "2";
            }

            else if (classe === "magica do lenço") {

                comando = "3";
            }

            else if (classe === "recomeço") {

                comando = "4";
            }

            // ===============================
            // ENVIAR PARA ARDUINO
            // ===============================

            if (comando !== "") {

                console.log(
                    "Classe detectada:",
                    classe
                );

                console.log(
                    "Comando enviado:",
                    comando
                );

                await enviarArduino(
                    comando + "\n"
                );
            }
        }

    } catch (erro) {

        console.error(
            "Erro na previsão:",
            erro
        );
    }
}
