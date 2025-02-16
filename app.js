document.addEventListener("DOMContentLoaded", function() {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const canvas2 = document.getElementById("canvas2");
    const output = document.getElementById("output");
    const captureButton = document.getElementById("capture");
    const compareButton = document.getElementById("compare");
    const savePDFButton = document.getElementById("savePDF");
    const installBtn = document.getElementById("installBtn");

    let firstImageCaptured = false;

    // Attiva la fotocamera posteriore (con fallback)
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } }
    })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Errore nell'accesso alla fotocamera:", err);
        // Fallback se exact: "environment" non è supportato
        return navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    })
    .then(stream => {
        if (stream) video.srcObject = stream;
    })
    .catch(err => console.error("Errore nel fallback fotocamera:", err));

    captureButton.addEventListener("click", function() {
        captureImage();
    });

    compareButton.addEventListener("click", function() {
        compareImages();
    });

    savePDFButton.addEventListener("click", function() {
        generatePDF();
    });

    function captureImage() {
        const ctx = firstImageCaptured ? canvas2.getContext("2d") : canvas.getContext("2d");
        const targetCanvas = firstImageCaptured ? canvas2 : canvas;
        
        targetCanvas.width = video.videoWidth;
        targetCanvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, targetCanvas.width, targetCanvas.height);

        // Inverte il flag
        firstImageCaptured = !firstImageCaptured;

        // Se abbiamo appena salvato sul primo canvas, elaboriamo quell'immagine
        if (!firstImageCaptured) {
            processImage(canvas, output);
        }
    }

    function processImage(inputCanvas, outputCanvas) {
        let src = cv.imread(inputCanvas);
        let dst = new cv.Mat();
        let gray = new cv.Mat();

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        cv.Canny(gray, dst, 50, 150, 3, false);

        cv.imshow(outputCanvas, dst);
        src.delete(); 
        gray.delete(); 
        dst.delete();
    }

    function compareImages() {
        // Controllo presenza di 2 immagini
        if (firstImageCaptured) {
            alert("Devi acquisire due immagini per confrontarle!");
            return;
        }

        let img1 = cv.imread(canvas);
        let img2 = cv.imread(canvas2);
        let diff = new cv.Mat();

        cv.absdiff(img1, img2, diff);
        cv.imshow(output, diff);

        img1.delete(); 
        img2.delete(); 
        diff.delete();
    }

    function generatePDF() {
        const { jsPDF } = window.jspdf;
        let pdf = new jsPDF();

        pdf.text("Report Usura Pneumatico", 10, 10);

        let imgData1 = canvas.toDataURL("image/png");
        let imgData2 = canvas2.toDataURL("image/png");
        let imgDataOutput = output.toDataURL("image/png");

        pdf.text("Immagine 1:", 10, 20);
        pdf.addImage(imgData1, "PNG", 10, 30, 90, 60);

        pdf.text("Immagine 2:", 10, 100);
        pdf.addImage(imgData2, "PNG", 10, 110, 90, 60);

        pdf.text("Differenze evidenziate:", 10, 180);
        pdf.addImage(imgDataOutput, "PNG", 10, 190, 90, 60);

        pdf.save("report_pneumatico.pdf");
    }

    // ---------------------------
    // Gestione installazione PWA
    // ---------------------------
    let deferredPrompt;
    window.addEventListener("beforeinstallprompt", (e) => {
        // Previene la mini-infobar di Chrome su Android
        e.preventDefault();
        deferredPrompt = e;
        // Mostra il pulsante dedicato all'installazione
        installBtn.style.display = "inline-block";
    });

    installBtn.addEventListener("click", async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                console.log("Installazione accettata");
            } else {
                console.log("Installazione rifiutata");
            }
            deferredPrompt = null;
            installBtn.style.display = "none";
        }
    });

    // Registrazione del Service Worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then(reg => console.log("Service Worker registrato con successo!", reg))
            .catch(err => console.log("Errore nella registrazione del Service Worker", err));
    }
});
