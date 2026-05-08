const URL = "./my_model/";
let model, webcam, labelContainer, maxPredictions;

// 1. Cargar el modelo al abrir la app
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    console.log("Modelo cargado.");
}
loadModel();

// 2. Opción A: Iniciar Cámara (Fuerza cámara trasera en móviles)
async function initCamera() {
    document.getElementById("image-preview").style.display = "none";
    const flip = false; // No necesitamos espejo para la cámara trasera
    webcam = new tmImage.Webcam(300, 300, flip);
    
    try {
        await webcam.setup({ facingMode: "environment" }); // "environment" pide la cámara de atrás
        await webcam.play();
        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        window.requestAnimationFrame(loop);
    } catch (e) {
        alert("Error al abrir cámara. Prueba subiendo una foto.");
        console.error(e);
    }
}

async function loop() {
    webcam.update();
    await predict(webcam.canvas);
    window.requestAnimationFrame(loop);
}

// 3. Opción B: Subir Archivo
document.getElementById('image-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = document.getElementById('image-preview');
    const reader = new FileReader();

    reader.onload = function(event) {
        img.src = event.target.result;
        img.style.display = "block";
        
        // Si la webcam estaba activa, la detenemos y limpiamos
        if (webcam) { 
            try { webcam.stop(); } catch(err) {} 
            document.getElementById("webcam-container").innerHTML = ""; 
        }
        
        // Colocamos la imagen en el contenedor si no estaba ahí
        document.getElementById("webcam-container").appendChild(img);

        // Ejecutamos la predicción cuando la imagen termine de renderizarse
        img.onload = async () => {
            await predict(img);
        };
    };
    reader.readAsDataURL(file);
});

// 4. Predicción Genérica
async function predict(imageElement) {
    const prediction = await model.predict(imageElement);
    let highestProb = 0;
    let bestClass = "";

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProb) {
            highestProb = prediction[i].probability;
            bestClass = prediction[i].className;
        }
    }

    const labelContainer = document.getElementById("label-container");
    if (highestProb > 0.50) { // Bajamos a 50% para pruebas iniciales
        labelContainer.innerHTML = `Detectado: ${bestClass} (${(highestProb * 100).toFixed(0)}%)`;
        actualizarInstrucciones(bestClass);
    }
}

function actualizarInstrucciones(clase) {
    const tipElement = document.getElementById("recycling-tip");
    const consejos = {
        "PET": "Lava y aplasta la botella antes de depositarla.",
        "Aluminio": "Asegúrate de que el recipiente este vacío y seco.",
        "Vidrio": "Cuidado con los bordes. Deposita en el contenedor verde.",
        "Carton_Papel": "Retira cualquier resto de comida."
    };
    tipElement.innerText = consejos[clase] || "Apunta a un objeto...";
}
