document.addEventListener('DOMContentLoaded', async () => {
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

    // Aggiungi questo dopo gli elementi principali
    const fullscreenButton = document.createElement('button');
    fullscreenButton.id = 'fullscreen-button';
    fullscreenButton.innerHTML = '⛶'; // Simbolo per fullscreen
    fullscreenButton.title = 'Modalità schermo intero';
    chatContainer.querySelector('.chat-header-content').appendChild(fullscreenButton);

    // Aggiungi i pulsanti per il controllo del testo dopo il pulsante fullscreen
    const fontControls = document.createElement('div');
    fontControls.className = 'font-controls';

    const decreaseFontBtn = document.createElement('button');
    decreaseFontBtn.innerHTML = 'A-';
    decreaseFontBtn.className = 'font-control-btn';
    decreaseFontBtn.title = 'Diminuisci testo';

    const increaseFontBtn = document.createElement('button');
    increaseFontBtn.innerHTML = 'A+';
    increaseFontBtn.className = 'font-control-btn';
    increaseFontBtn.title = 'Aumenta testo';

    fontControls.appendChild(decreaseFontBtn);
    fontControls.appendChild(increaseFontBtn);

    chatContainer.querySelector('.chat-header-content').appendChild(fontControls);

    // Stati della chat
    const CHAT_STATES = {
        WIDGET: 'widget',
        SIDEBAR: 'sidebar',
        FULLSCREEN: 'fullscreen'
    };

    let currentState = CHAT_STATES.WIDGET;

    // Funzione per gestire la transizione degli stati
    function updateChatState(newState) {
        switch(newState) {
            case CHAT_STATES.WIDGET:
                chatContainer.classList.remove('open', 'fullscreen');
                chatWidget.classList.remove('hidden');
                break;
            case CHAT_STATES.SIDEBAR:
                chatContainer.classList.add('open');
                chatContainer.classList.remove('fullscreen');
                chatWidget.classList.add('hidden');
                break;
            case CHAT_STATES.FULLSCREEN:
                chatContainer.classList.add('open', 'fullscreen');
                chatWidget.classList.add('hidden');
                break;
        }
        currentState = newState;
    }

    // Stato della chat
    let messageHistory = [];

    // Funzione per caricare il file instructions.txt
    async function loadInstructions() {
        try {
            const response = await fetch('/static/instructions.txt'); // Percorso del file instructions.txt
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const instructionText = await response.text();
            messageHistory = [
                {
                    role: "system",
                    content: instructionText
                }
            ];
        } catch (error) {
            console.error('Errore durante il caricamento delle istruzioni:', error);
            messageHistory = [
                {
                    role: "system",
                    content: "Errore nel caricamento delle istruzioni. Usa il fallback predefinito."
                }
            ];
        }
    }

    // Carica le istruzioni iniziali
    await loadInstructions();

    // Click sul widget
    chatWidget.addEventListener('click', () => {
        updateChatState(CHAT_STATES.SIDEBAR);
    });

    // Click sul pulsante fullscreen
    fullscreenButton.addEventListener('click', () => {
        if (currentState === CHAT_STATES.SIDEBAR) {
            updateChatState(CHAT_STATES.FULLSCREEN);
            fullscreenButton.innerHTML = '⊏'; // Icona per tornare alla modalità laterale
        } else {
            updateChatState(CHAT_STATES.SIDEBAR);
            fullscreenButton.innerHTML = '⛶'; // Icona per espandere
        }
    });

    // Click sul pulsante chiudi
    closeChat.addEventListener('click', () => {
        updateChatState(CHAT_STATES.WIDGET);
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
    uploadPdfInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            addMessage(`Hai caricato il file: ${file.name}`, 'bot');
            await simulateFileUpload(file);
        }
    });

    // Funzione per inviare il file PDF al backend e aggiungere il testo e il titolo al prompt
    async function simulateFileUpload(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('https://counselorbot.onrender.com:8000/upload-and-process', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Risposta dal backend:', responseData);

            // Aggiungi il titolo del file e il contenuto estratto al prompt
            const extractedText = responseData.extracted_text;
            if (extractedText) {
                // Aggiungi il titolo e il contenuto del PDF nella cronologia
                messageHistory.push({
                    role: "user",
                    content: `Titolo del file caricato: ${file.name}`
                });
                messageHistory.push({
                    role: "user",
                    content: `Contenuto del PDF (${file.name}):\n${extractedText}`
                });

                // Mostra un messaggio al bot per confermare il caricamento
                addMessage(`Il contenuto del file "${file.name}" è stato caricato correttamente.`, 'bot');
            } else {
                addMessage('Errore: Il PDF non contiene testo elaborabile.', 'bot');
            }
        } catch (error) {
            console.error('Errore durante il caricamento del file:', error);
            addMessage('Errore durante il caricamento del file.', 'bot');
        }
    }

    // Invio messaggio al backend
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
                const response = await fetch('https://counselorbot.onrender.com:8000/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
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
                addMessage('Errore di connessione. Controlla il server.', 'bot');
            } finally {
                setInputState(false); // Riabilita input
            }
        }
    }

    // Funzione per aggiungere un messaggio alla chat, con supporto Markdown
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        // Converti il testo da Markdown a HTML
        const parsedMarkdown = marked.parse(text);

        // Evidenzia il titolo del file se presente
        if (text.startsWith('Titolo del file caricato:')) {
            messageDiv.innerHTML = `<strong>${parsedMarkdown}</strong>`;
        } else {
            messageDiv.innerHTML = parsedMarkdown;
        }

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

    // Disabilita/abilita l'input
    function setInputState(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
    }

    // Gestione dimensione del testo
    let currentFontSize = 14; // dimensione base
    const minFontSize = 12;
    const maxFontSize = 20;
    const stepSize = 2;

    function updateFontSize(change) {
        const newSize = currentFontSize + change;
        if (newSize >= minFontSize && newSize <= maxFontSize) {
            currentFontSize = newSize;
            
            // Applica le dimensioni relative a tutti gli elementi
            const root = document.documentElement;
            root.style.setProperty('--base-font-size', `${currentFontSize}px`);
            
            // Aggiorna dimensioni specifiche per vari elementi
            const fontSizeMap = {
                '.message': '1em',
                '.widget-text': '0.85em',
                '.chat-title': '1rem',
                '.initial-questions': '0.9em',
                '.context-details': '0.85em',
                '.context-details pre': '0.8em',
                '#user-input': '0.9em',
                '.chat-footer': '0.75em'
            };

            Object.entries(fontSizeMap).forEach(([selector, size]) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => el.style.fontSize = size);
            });
        }
    }

    decreaseFontBtn.addEventListener('click', () => updateFontSize(-stepSize));
    increaseFontBtn.addEventListener('click', () => updateFontSize(stepSize));
});