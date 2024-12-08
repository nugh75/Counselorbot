document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Chat history per la comunicazione con il backend
    let messageHistory = [
        {
            role: "system",
            content: `
Tu sei un tutor orientatore serio e professionale, specializzato nel guidare studenti delle scuole verso scelte consapevoli per il loro percorso formativo e professionale. Rispondi in modo formale e ben strutturato.
`
        }
    ];

    // Aggiungi un messaggio iniziale
    addMessage('Benvenuto! Sono qui per aiutarti a orientarti nel tuo percorso scolastico e professionale.', 'bot');

    // Altezza dinamica per l'input utente
    userInput.addEventListener('input', () => {
    // Imposta un'altezza minima per prevenire contrazioni eccessive
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 200)}px`; // Limita l'altezza a un massimo di 200px
    });

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
        messageDiv.innerHTML = convertMarkdownToHtml(text);
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

    // Funzione per convertire il testo Markdown in HTML
    function convertMarkdownToHtml(markdownText) {
        let html = markdownText;

        // Titoli
        html = html.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
        html = html.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
        html = html.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

        // Grassetto
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Corsivo
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

        return html;
    }
});