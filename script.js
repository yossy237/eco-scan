const URL_MODELO = "./my_model/";

let model, webcam, labelContainer, maxPredictions;
let isScanning = true;

const consejosReciclaje = {
    "PET": "Deposite en el contenedor AZUL. Asegúrese de que la botella esté vacía, aplastada y con su tapa puesta.",
    "Aluminio": "Deposite en el contenedor GRIS/VERDE. Enjuague ligeramente la lata y compáctela si es posible.",
    "Vidrio": "Deposite en el contenedor VERDE claros/oscuros. Maneje con cuidado. No introduzca cerámicas ni cristales rotos.",
    "Carton_Papel": "Deposite en el contenedor AMARILLO/GRIS. El cartón debe estar seco, limpio y completamente plegado."
};

async function initCamera() {
    document.getElementById("image-preview").style.display = "none";
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "Cargando modelo de IA...";

    if (!model) {
        const modelURL = URL_MODELO + "model.json";
        const metadataURL = URL_MODELO + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }

    const flip = true;
    webcam = new tmImage.Webcam(300, 300, flip); 
    
    try {
        await webcam.setup({ facingMode: "environment" }); 
        await webcam.play();
        
        isScanning = true;
        document.getElementById("webcam-container").innerHTML = ""; 
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        const btnCapture = document.getElementById("btn-capture");
        btnCapture.style.display = "block";
        btnCapture.innerHTML = "Escanear residuo";
        btnCapture.style.backgroundColor = "#e67e22"; 

        labelContainer.innerHTML = "Apunte a un residuo...";
        window.requestAnimationFrame(loop);
    } catch (error) {
        labelContainer.innerHTML = "Error al acceder a la cámara.";
        console.error(error);
    }
}

async function loop() {
    if (!isScanning) return;
    webcam.update(); 
    await predict(webcam.canvas);
    window.requestAnimationFrame(loop);
}

function toggleScan() {
    const btnCapture = document.getElementById("btn-capture");
    if (isScanning) {
        isScanning = false;
        btnCapture.innerHTML = "Escanear Otro";
        btnCapture.style.backgroundColor = "#2c3e50"; 
    } else {
        isScanning = true;
        btnCapture.innerHTML = "Escanear residuo";
        btnCapture.style.backgroundColor = "#e67e22"; 
        window.requestAnimationFrame(loop);
    }
}

async function predict(elementoImagen) {
    const prediction = await model.predict(elementoImagen);
    let mejorClase = "";
    let maximaProbabilidad = 0;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > maximaProbabilidad) {
            maximaProbabilidad = prediction[i].probability;
            mejorClase = prediction[i].className;
        }
    }

    const porcentajeVisual = (maximaProbabilidad * 90).toFixed(2);
    labelContainer.innerHTML = `Detectado: <strong>${mejorClase}</strong> (${porcentajeVisual}%)`;

    const contenedorConsejo = document.getElementById("recycling-tip");
    if (consejosReciclaje[mejorClase]) {
        contenedorConsejo.innerHTML = consejosReciclaje[mejorClase];
    } else {
        contenedorConsejo.innerHTML = "Residuos no identificados claramente.";
    }
}

document.getElementById("image-upload").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (webcam) {
        try { webcam.stop(); } catch(e) {}
    }
    // Ocultar el botón de escanear video ya que es una foto fija manual
    document.getElementById("btn-capture").style.display = "none";

    const imgPreview = document.getElementById("image-preview");
    imgPreview.src = URL.createObjectURL(file);
    imgPreview.style.display = "block";
    
    document.getElementById("webcam-container").innerHTML = "";
    document.getElementById("webcam-container").appendChild(imgPreview);

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "Analizando archivo de imagen...";

    if (!model) {
        const modelURL = URL_MODELO + "model.json";
        const metadataURL = URL_MODELO + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }

    imgPreview.onload = async () => {
        await predict(imgPreview);
    };
});