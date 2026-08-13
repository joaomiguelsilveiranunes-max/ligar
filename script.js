// ==========================================
// MODELO TEACHABLE MACHINE
// ==========================================

const URL =
    "https://teachablemachine.withgoogle.com/models/d1OE97UJY/";


// ==========================================
// VARIÁVEIS
// ==========================================

let model = null;

let webcam = null;

let labelContainer = null;

let maxPredictions = 0;

let port = null;

let writer = null;

let ultimaClasse = "";

let cameraLigada = false;

let arduinoConectado = false;


// ==========================================
// ELEMENTOS HTML
// ==========================================

const webcamContainer =
    document.getElementById("webcam-container");

const resultado =
    document.getElementById("resultado");

const historico =
    document.getElementById("historico");

const btnCamera =
    document.getElementById("btnCamera");

const btnArduino =
    document.getElementById("btnArduino");

const statusCamera =
    document.getElementById("statusCamera");

const statusArduino =
    document.getElementById("statusArduino");


// ==========================================
// CONECTAR ARDUINO
// ==========================================

async function connectArduino() {

    if (!("serial" in navigator)) {

        alert(
            "Seu navegador não suporta Web Serial.\n\n" +
            "Use Google Chrome ou Microsoft Edge."
        );

        return;
    }


    try {

        statusArduino.innerHTML =
            "🟡 Arduino: escolhendo porta...";


        port =
            await navigator.serial.requestPort();


        await port.open({
            baudRate: 9600
        });


        if (!port.writable) {

            throw new Error(
                "A porta serial não permite escrita."
            );
        }


        writer =
            port.writable.getWriter();


        arduinoConectado = true;


        statusArduino.innerHTML =
            "🟢 Arduino: conectado";


        btnArduino.innerHTML =
            "🟢 Arduino Conectado";


        btnArduino.disabled = true;


        console.log(
            "Arduino conectado com sucesso!"
        );

    }

    catch (erro) {

        console.error(
            "Erro ao conectar Arduino:",
            erro
        );


        arduinoConectado = false;


        statusArduino.innerHTML =
            "🔴 Arduino: erro na conexão";


        alert(
            "Não foi possível conectar ao Arduino.\n\n" +
            "Verifique se ele está conectado ao computador."
        );
    }
}


// ==========================================
// ENVIAR COMANDO PARA ARDUINO
// ==========================================

async function enviarArduino(comando) {

    if (!writer) {

        console.log(
            "Arduino não conectado."
        );

        return;
    }


    try {

        const encoder =
            new TextEncoder();


        await writer.write(
            encoder.encode(comando)
        );


        console.log(
            "Comando enviado para Arduino:",
            comando.trim()
        );

    }

    catch (erro) {

        console.error(
            "Erro enviando comando:",
            erro
        );


        arduinoConectado = false;


        statusArduino.innerHTML =
            "🔴 Arduino: conexão perdida";
    }
}


// ==========================================
// INICIAR CÂMERA
// ==========================================

async function init() {

    if (cameraLigada) {

        console.log(
            "A câmera já está ligada."
        );

        return;
    }


    try {

        btnCamera.disabled = true;


        statusCamera.innerHTML =
            "🟡 Câmera: carregando modelo...";


        // ==================================
        // CARREGAR MODELO
        // ==================================

        const modelURL =
            URL + "model.json";

        const metadataURL =
            URL + "metadata.json";


        model =
            await tmImage.load(
                modelURL,
                metadataURL
            );


        maxPredictions =
            model.getTotalClasses();


        console.log(
            "Modelo carregado!"
        );

        console.log(
            "Classes encontradas:",
            maxPredictions
        );


        // ==================================
        // CRIAR WEBCAM
        // ==================================

        statusCamera.innerHTML =
            "🟡 Câmera: pedindo permissão...";


        webcam =
            new tmImage.Webcam(
                320,
                320,
                true
            );


        await webcam.setup();


        await webcam.play();


        cameraLigada = true;


        // ==================================
        // MOSTRAR CÂMERA
        // ==================================

        webcamContainer.innerHTML = "";


        webcamContainer.appendChild(
            webcam.canvas
        );


        // ==================================
        // CRIAR CLASSES
        // ==================================

        labelContainer =
            document.getElementById(
                "label-container"
            );


        labelContainer.innerHTML = "";


        for (
            let i = 0;
            i < maxPredictions;
            i++
        ) {

            const div =
                document.createElement("div");


            div.className =
                "classe";


            div.innerHTML = `
                <div>Carregando...</div>

                <div class="barra">

                    <div
                        class="preenchimento"
                    ></div>

                </div>
            `;


            labelContainer.appendChild(
                div
            );
        }


        // ==================================
        // STATUS
        // ==================================

        statusCamera.innerHTML =
            "🟢 Câmera: funcionando";


        btnCamera.innerHTML =
            "🟢 Câmera Ligada";


        // ==================================
        // COMEÇAR RECONHECIMENTO
        // ==================================

        window.requestAnimationFrame(
            loop
        );


        console.log(
            "Reconhecimento iniciado!"
        );

    }

    catch (erro) {

        console.error(
            "Erro ao iniciar câmera:",
            erro
        );


        cameraLigada = false;


        btnCamera.disabled = false;


        btnCamera.innerHTML =
            "📷 Iniciar Câmera";


        statusCamera.innerHTML =
            "🔴 Câmera: erro";


        alert(
            "Não foi possível iniciar a câmera.\n\n" +
            "Verifique se o navegador tem permissão " +
            "para acessar a câmera."
        );
    }
}


// ==========================================
// LOOP
// ==========================================

async function loop() {

    if (
        !cameraLigada ||
        !webcam
    ) {

        return;
    }


    webcam.update();


    await predict();


    window.requestAnimationFrame(
        loop
    );
}


// ==========================================
// PREDIÇÃO
// ==========================================

async function predict() {

    if (
        !model ||
        !webcam ||
        !labelContainer
    ) {

        return;
    }


    try {

        const prediction =
            await model.predict(
                webcam.canvas
            );


        let maior = 0;

        let classe = "";


        // ==================================
        // ANALISAR CLASSES
        // ==================================

        for (
            let i = 0;
            i < prediction.length;
            i++
        ) {

            const p =
                prediction[i];


            const porcentagem =
                p.probability * 100;


            const elemento =
                labelContainer
                    .childNodes[i];


            if (elemento) {

                elemento
                    .children[0]
                    .innerHTML =
                        p.className +
                        " : " +
                        porcentagem
                            .toFixed(1) +
                        "%";


                elemento
                    .children[1]
                    .children[0]
                    .style.width =
                        porcentagem + "%";
            }


            // ==================================
            // MAIOR PROBABILIDADE
            // ==================================

            if (
                p.probability > maior
            ) {

                maior =
                    p.probability;

                classe =
                    p.className;
            }
        }


        // ==================================
        // MOSTRAR RESULTADO
        // ==================================

        resultado.innerHTML =
            classe +
            "<br>" +
            (maior * 100)
                .toFixed(1) +
            "%";


        // ==================================
        // EXIGIR 90%
        // ==================================

        if (
            maior <= 0.90
        ) {

            return;
        }


        // ==================================
        // EVITAR REPETIÇÃO
        // ==================================

        if (
            classe === ultimaClasse
        ) {

            return;
        }


        ultimaClasse =
            classe;


        // ==================================
        // COMANDOS
        // ==================================

        let comando = "";


        if (
            classe ===
            "magica da flor"
        ) {

            comando = "1";
        }

        else if (
            classe ===
            "magica da bola"
        ) {

            comando = "2";
        }

        else if (
            classe ===
            "magica do lenço"
        ) {

            comando = "3";
        }

        else if (
            classe ===
            "recomeço"
        ) {

            comando = "4";
        }


        // ==================================
        // ENVIAR PARA ARDUINO
        // ==================================

        if (
            comando !== ""
        ) {

            console.log(
                "Classe detectada:",
                classe
            );

            console.log(
                "Enviando comando:",
                comando
            );


            await enviarArduino(
                comando + "\n"
            );


            adicionarHistorico(
                classe,
                comando
            );
        }

    }

    catch (erro) {

        console.error(
            "Erro na previsão:",
            erro
        );
    }
}


// ==========================================
// HISTÓRICO
// ==========================================

function adicionarHistorico(
    classe,
    comando
) {

    const item =
        document.createElement("li");


    const hora =
        new Date()
            .toLocaleTimeString();


    item.innerHTML =
        "🪄 " +
        classe +
        " → comando " +
        comando +
        " | " +
        hora;


    historico.prepend(
        item
    );


    // Limitar histórico a 10 itens

    while (
        historico.children.length > 10
    ) {

        historico.removeChild(
            historico.lastChild
        );
    }
}
