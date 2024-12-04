document.addEventListener('DOMContentLoaded', () => {
    // Elementi per il chatbot
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Elementi per il caricamento dei file
    const uploadForm = document.getElementById("upload-form");
    const databaseNameInput = document.getElementById("database-name");
    const descriptionInput = document.getElementById("description");
    const fileInput = document.getElementById("files");
    const responseDiv = document.getElementById("response");

    // Chat history for context
    let messageHistory = [
        { role: "system", content: "Always answer in rhymes. Today is Thursday" }
    ];

    // Funzione per inviare messaggi al chatbot
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            try {
                setInputState(true); // Disabilita l'input mentre elabora

                // Aggiungi il messaggio dell'utente all'interfaccia e alla cronologia
                addMessage(message, 'user');
                messageHistory.push({ role: "user", content: message });
                userInput.value = '';

                // Crea il contenitore per la risposta del bot
                const responseDiv = document.createElement('div');
                responseDiv.classList.add('message', 'bot');
                chatMessages.appendChild(responseDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Invio al backend
                const response = await fetch('http://localhost:8000/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'text/event-stream'
                    },
                    body: JSON.stringify({
                        messages: messageHistory,
                        temperature: 0.7,
                        model: "hugging-quants/llama-3.2-3b-instruct"
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let botResponse = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const jsonData = JSON.parse(line.slice(6));
                                if (jsonData.choices &&
                                    jsonData.choices[0].delta &&
                                    jsonData.choices[0].delta.content) {
                                    botResponse += jsonData.choices[0].delta.content;
                                    responseDiv.textContent = botResponse;
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                            } catch (e) {
                                console.error('Error parsing JSON:', e);
                            }
                        }
                    }
                }

                // Aggiungi la risposta del bot alla cronologia
                if (botResponse) {
                    messageHistory.push({ role: "assistant", content: botResponse });
                }

            } catch (error) {
                console.error('Error:', error);
                addMessage('Mi dispiace, si è verificato un errore nella comunicazione con il modello.', 'bot');
            } finally {
                setInputState(false); // Riabilita l'input
            }
        }
    }

    // Aggiunge un messaggio alla chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Event listeners per il chatbot
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Disabilita/abilita input mentre elabora
    function setInputState(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
    }

    // Funzione per gestire l'invio del modulo di caricamento file
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
