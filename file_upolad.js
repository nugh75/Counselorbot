document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById("upload-form");
    const databaseNameInput = document.getElementById("database-name");
    const descriptionInput = document.getElementById("description");
    const fileInput = document.getElementById("files");
    const responseDiv = document.getElementById("response");

    // Gestisce l'invio del modulo di caricamento file
    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Previene il comportamento predefinito del modulo

        // Crea un oggetto FormData per inviare i dati al backend
        const formData = new FormData();
        formData.append("database_name", databaseNameInput.value);
        formData.append("description", descriptionInput.value);

        // Aggiungi i file caricati all'oggetto FormData
        const files = fileInput.files;
        for (let file of files) {
            formData.append("files", file);
        }

        // Mostra un messaggio di caricamento
        responseDiv.textContent = "Creazione del database in corso...";

        try {
            // Invia la richiesta al backend
            const response = await fetch("http://localhost:8000/upload-files/", {
                method: "POST",
                body: formData,
            });

            // Controlla se la richiesta ha avuto successo
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Errore durante la creazione del database.");
            }

            // Ottieni la risposta JSON dal server
            const responseData = await response.json();

            // Mostra il messaggio di successo
            responseDiv.innerHTML = `
                <p>Successo: ${responseData.message}</p>
                <p>Documenti indicizzati: ${responseData.documents}</p>
            `;
        } catch (error) {
            // Mostra un messaggio di errore
            responseDiv.innerHTML = `<p style="color: red;">Errore: ${error.message}</p>`;
        }
    });
});
