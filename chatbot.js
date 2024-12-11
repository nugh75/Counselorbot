document.addEventListener('DOMContentLoaded', () => {
    // Elementi principali
    const chatWidget = document.getElementById('chat-widget');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const initialQuestions = document.getElementById('initial-questions');
    const chatInputWrapper = document.getElementById('chat-input-wrapper');
    const fileUploadWrapper = document.getElementById('file-upload-wrapper');
    const submitInfo = document.getElementById('submit-info');
    const userNameInput = document.getElementById('user-name');
    const userAgeInput = document.getElementById('user-age');
    const userRoleInput = document.getElementById('user-role');
    const uploadPdfInput = document.getElementById('upload-pdf');

    // Stato della chat
    let messageHistory = [
        {
            role: "system",
            content: `
            Tu sei un tutor orientatore serio e professionale, specializzato nel guidare studenti delle scuole verso scelte consapevoli per il loro percorso formativo e professionale...
            `
        }
    ];

    // Funzione per espandere la chat
    chatWidget.addEventListener('click', () => {
        chatContainer.classList.add('open');
        chatWidget.classList.add('hidden');
    });

    // Funzione per chiudere la chat
    closeChat.addEventListener('click', () => {
        chatContainer.classList.remove('open');
        chatWidget.classList.remove('hidden');
    });

    // Messaggio di benvenuto
    addMessage('Benvenuto! Sono qui per aiutarti a orientarti nel tuo percorso scolastico e professionale.', 'bot');

    // Altezza dinamica per l'input utente
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = `${Math.min(userInput.scrollHeight, 200)}px`; // Limita l'altezza a un massimo di 200px
    });

    // Gestione dell'invio delle informazioni iniziali
    submitInfo.addEventListener('click', () => {
        const name = userNameInput.value.trim();
        const age = userAgeInput.value.trim();
        const role = userRoleInput.value;

        if (name && age && role) {
            const userInfo = `Nome: ${name}, Età: ${age}, Ruolo: ${role}`;
            messageHistory[0].content += `\nInformazioni Utente: ${userInfo}`;
            addMessage(`Grazie, ${name}. Ora possiamo iniziare!`, 'bot');
            initialQuestions.classList.add('hidden');
            chatInputWrapper.classList.remove('hidden');
            fileUploadWrapper.classList.remove('hidden'); // Mostra caricamento file
        } else {
            addMessage('Per favore, compila tutte le informazioni.', 'bot');
        }
    });

    // Gestione del caricamento del PDF
    uploadPdfInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            addMessage(`Hai caricato il file: ${file.name}`, 'bot');
            // Simula l'invio del file al backend
            simulateFileUpload(file);
        }
    });

    // Funzione per simulare l'invio del file PDF al backend
    function simulateFileUpload(file) {
        console.log(`Caricamento file al backend: ${file.name}`);
        // Qui puoi implementare una richiesta reale al backend
    }

    // Invio messaggio
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            try {
                setInputState(true); // Disabilita input durante l'elaborazione
                addMessage(message, 'user');
                messageHistory.push({ role: "user", content: message });
                userInput.value = '';
                userInput.style.height = 'auto'; // Resetta altezza dopo invio

                // Invio al backend
                const response = await fetch('http://localhost:8000/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "hugging-quants/llama-3.2-3b-instruct",
                        messages: messageHistory,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const responseData = await response.json();
                console.log('Risposta ricevuta dal backend:', responseData);

                const botResponse = responseData.llm_response;
                const contextChunks = responseData.context_chunks;

                // Mostra la risposta principale
                addMessage(botResponse, 'bot');

                // Mostra i chunk di contesto se disponibili
                if (contextChunks && contextChunks.length > 0) {
                    addContextChunks(contextChunks);
                }

                // Aggiungi solo la risposta principale alla cronologia
                messageHistory.push({ role: "assistant", content: botResponse });

            } catch (error) {
                console.error('Errore durante la comunicazione con il backend:', error);
                addMessage('Mi dispiace, si è verificato un errore nella comunicazione con il modello.', 'bot');
            } finally {
                setInputState(false); // Riabilita input
            }
        }
    }

    // Funzione per aggiungere un messaggio alla chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Funzione per aggiungere chunk di contesto
    function addContextChunks(contextChunks) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('context-wrapper');

        const title = document.createElement('div');
        title.textContent = "Contesto Recuperato:";
        title.classList.add('context-title');
        wrapper.appendChild(title);

        contextChunks.forEach((chunk, index) => {
            const detailsElement = document.createElement('details');
            detailsElement.classList.add('context-details');

            const summaryElement = document.createElement('summary');
            summaryElement.textContent = `Chunk ${index + 1} (Fonte: ${chunk.source.filename}, Pagina: ${chunk.source.page_number})`;
            summaryElement.classList.add('context-summary');
            detailsElement.appendChild(summaryElement);

            const preElement = document.createElement('pre');
            preElement.textContent = chunk.content.trim();
            detailsElement.appendChild(preElement);

            wrapper.appendChild(detailsElement);
        });

        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Gestione click e invio
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function setInputState(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
    }
});