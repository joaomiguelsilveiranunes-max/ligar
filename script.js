// ==========================================
// CONFIGURAÇÃO DO MODELO
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
// ELEMENTOS DA PÁGINA
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
// VERIFICAÇÕES
// ==========================================

console.log("=================================");
console.log("SCRIPT CARREGADO!");
console.log("Teachable Machine:", typeof tmImage);
console.log(
    "Web Serial:",
    "serial" in navigator
);
console.log(
    "Câmera:",
    !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
    )
);
console.log("=================================");


// ==========================================
// CONECTAR ARDUINO
// ==========================================

async function connectArduino() {

    console.log("Conectando Arduino...");


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


        console.log(
            "Porta selecionada."
        );


        await port.open({
            baudRate: 9600
        });


        console.log(
            "Porta aberta em 9600 baud."
        );


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
            "🔴 Arduino: erro";


        btnArduino.disabled = false;


        btnArduino.innerHTML =
            "🔌 Conectar Arduino";


        alert(
            "Não foi possível conectar ao Arduino.\n\n" +
            "Verifique se ele está conectado e tente novamente."
        );
    }
}


// ==========================================
// ENVIAR COMANDO PARA ARDUINO
// ==========================================

async function enviarArduino(comando) {

    console.log(
        "Enviando para Arduino:",
        comando.trim()
    );


    if (!writer) {

        console.log(
            "Arduino não está conectado."
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
            "Comando enviado com sucesso:",
            comando.trim()
        );

    }

    catch (erro) {

        console.error(
            "Erro ao enviar comando:",
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

    console.log(
        "Botão Iniciar Câmera pressionado."
    );


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


        // Verificar biblioteca

        if (
            typeof tmImage === "undefined"
        ) {

            throw new Error(
                "A biblioteca Teachable Machine não foi carregada."
            );
        }


        // Verificar câmera

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "A câmera não está disponível."
            );
        }


        // URLs do modelo

        const modelURL =
            URL + "model.json";

        const metadataURL =
            URL + "metadata.json";


        console.log(
            "Carregando modelo..."
        );


        // Carregar modelo

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
            "Número de classes:",
            maxPredictions
        );


        // Pedir câmera

        statusCamera.innerHTML =
            "🟡 Câmera: pedindo permissão...";


        webcam =
            new tmImage.Webcam(
                320,
                320,
                true
            );


        await webcam.setup();


        console.log(
            "Permissão da câmera concedida."
        );


        await webcam.play();


        console.log(
            "Câmera ligada."
        );


        cameraLigada = true;


        // Mostrar câmera

        webcamContainer.innerHTML = "";


        webcamContainer.appendChild(
            webcam.canvas
        );


        // Criar probabilidades

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
                    <div class="preenchimento"></div>
                </div>
            `;


            labelContainer.appendChild(
                div
            );
        }


        // Status

        statusCamera.innerHTML =
            "🟢 Câmera: funcionando";


        btnCamera.innerHTML =
            "🟢 Câmera Ligada";


        // Iniciar reconhecimento

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
            "Erro: " +
            erro.message
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


    try {

        webcam.update();


        await predict();

    }

    catch (erro) {

        console.error(
            "Erro no loop:",
            erro
        );
    }


    window.requestAnimationFrame(
        loop
    );
}


// ==========================================
// RECONHECIMENTO
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


        // ======================================
        // ANALISAR CLASSES
        // ======================================

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
                labelContainer.children[i];


            if (elemento) {

                elemento.children[0].innerHTML =
                    p.className +
                    " : " +
                    porcentagem.toFixed(1) +
                    "%";


                elemento.children[1]
                    .children[0]
                    .style.width =
                    porcentagem + "%";
            }


            // Encontrar maior probabilidade

            if (
                p.probability > maior
            ) {

                maior =
                    p.probability;

                classe =
                    p.className;
            }
        }


        // ======================================
        // MOSTRAR RESULTADO
        // ======================================

        resultado.innerHTML =
            classe +
            "<br>" +
            (maior * 100).toFixed(1) +
            "%";


        // ======================================
        // PRECISA DE 90%
        // ======================================

        if (
            maior < 0.90
        ) {

            return;
        }


        // ======================================
        // NORMALIZAR CLASSE
        // ======================================

        const classeNormalizada =
            classe
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );


        console.log(
            "Classe original:",
            classe
        );


        console.log(
            "Classe normalizada:",
            classeNormalizada
        );


        console.log(
            "Confiança:",
            (maior * 100).toFixed(1) + "%"
        );


        // ======================================
        // DEFINIR COMANDO
        // ======================================

        let comando = "";


        // FLOR

        if (
            classeNormalizada ===
            "magica da flor"
        ) {

            comando = "1";
        }


        // BOLA

        else if (
            classeNormalizada ===
            "magica da bola"
        ) {

            comando = "2";
        }


        // LENÇO

        else if (
            classeNormalizada ===
            "lenco"
        ) {

            comando = "3";
        }


        // RECOMEÇO

        else if (
            classeNormalizada ===
            "recomeco"
        ) {

            comando = "4";
        }


        // ======================================
        // MOSTRAR COMANDO
        // ======================================

        console.log(
            "Comando escolhido:",
            comando
        );


        // Classe não reconhecida

        if (
            comando === ""
        ) {

            console.log(
                "Classe sem comando correspondente."
            );

            return;
        }


        // ======================================
        // NÃO REPETIR
        // ======================================

        if (
            classeNormalizada ===
            ultimaClasse
        ) {

            return;
        }


        ultimaClasse =
            classeNormalizada;


        // ======================================
        // ENVIAR ARDUINO
        // ======================================

        console.log(
            "================================="
        );


        console.log(
            "ENVIANDO PARA ARDUINO:",
            comando
        );


        console.log(
            "================================="
        );


        await enviarArduino(
            comando + "\n"
        );


        // Histórico

        adicionarHistorico(
            classe,
            comando
        );

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

    if (!historico) {
        return;
    }


    const item =
        document.createElement("li");


    const hora =
        new Date().toLocaleTimeString();


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


    // Limitar a 10 registros

    while (
        historico.children.length > 10
    ) {

        historico.removeChild(
            historico.lastChild
        );
    }
}
