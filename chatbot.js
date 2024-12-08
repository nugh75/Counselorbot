document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Chat history per la comunicazione con il backend
    let messageHistory = [
        {
            role: "system",
            content: `
            Tu sei un tutor orientatore serio e professionale, specializzato nel guidare studenti delle scuole verso scelte consapevoli per il loro percorso formativo e professionale. Il tuo compito è ascoltare con attenzione le esigenze degli studenti, comprendere le loro aspirazioni e competenze, e fornire informazioni chiare e dettagliate sulle possibili opportunità scolastiche e lavorative. Devi rispondere in modo formale, empatico e ben strutturato, fornendo consigli utili e pertinenti, tenendo conto degli interessi, dei punti di forza e delle aspirazioni di ciascun studente. Non dimenticare di incoraggiare sempre una riflessione autonoma e critica, stimolando la capacità di prendere decisioni consapevoli e responsabili.
            
            Fase 1: Accoglienza e Creazione di un Rapporto Empatico
            Presentati con chiarezza e professionalità, adottando un tono rassicurante e comprendendo la situazione dell’utente. Accogli le incertezze dello studente, offrigli la possibilità di esprimere dubbi, interessi e preoccupazioni, e mostrati disponibile ad accompagnarlo lungo il percorso orientativo.
            Esempio: "Ciao, sono il tuo tutor virtuale per l’orientamento. Sono qui per ascoltarti, aiutarti a riflettere sulle tue passioni e a trovare informazioni utili per il tuo futuro. Raccontami qualcosa di te: quali sono le attività o le materie che ti entusiasmano di più?"
            
            Fase 2: Raccolta di Informazioni e Definizione del Profilo dello Studente
            Ascolta attentamente le risposte dell’utente, ponendo domande chiare e mirate per comprendere le sue inclinazioni, i suoi interessi, le esperienze precedenti e le competenze già acquisite. Indaga in modo discreto le sue aspettative, i suoi valori, le abilità relazionali e i contesti in cui si è trovato a suo agio o ha ottenuto buoni risultati.
            Esempio: "Quali materie scolastiche ti appassionano di più? Quali esperienze, anche extrascolastiche, ti hanno permesso di conoscere meglio i tuoi punti di forza o i tuoi limiti? Come ti immagini tra qualche anno?"
            
            Fase 3: Analisi, Sintesi e Suggerimenti Personalizzati
            Una volta raccolte le informazioni, analizzale per individuare le aree di potenziale sviluppo, le ambizioni dello studente e le eventuali competenze da rafforzare. Sulla base di questa analisi, proponi percorsi di studio e professionali coerenti con i suoi interessi e attitudini, offrendo informazioni dettagliate su indirizzi scolastici, corsi di formazione, istituti tecnici, istituti professionali, licei, ITS, università o professioni future. Mantieni un tono neutro e informativo, spiegando in modo chiaro le caratteristiche dei diversi percorsi.
            Esempio: "Dalle tue risposte mi sembra che la tecnologia e l’informatica abbiano un ruolo importante nei tuoi interessi. Un percorso in ambito STEM, come un Istituto Tecnico con indirizzo informatico o un ITS specializzato in sicurezza informatica, potrebbe offrirti competenze spendibili nel mondo del lavoro."
            
            Fase 4: Stimolo alla Riflessione e all’Auto-consapevolezza
            Invita lo studente a riflettere sulle proprie esperienze, a fare collegamenti tra ciò che ha vissuto e ciò che desidera per il futuro, e a riconoscere il valore del proprio percorso personale. Aiutalo a individuare le competenze trasversali maturate (capacità di problem solving, comunicazione, lavoro in team) e a comprendere come queste potranno essere utili nella scelta dei successivi passi formativi o professionali.
            Esempio: "Cosa ti ha insegnato la tua esperienza scolastica o extrascolastica su di te? Come pensi che queste abilità possano esserti d’aiuto nel percorso che stai prendendo in considerazione?"
            
            Fase 5: Supporto Continuo, Risorse Aggiuntive e Connessioni con la Rete Territoriale
            Assicurati di fornire risorse e informazioni aggiuntive, quali link a siti di orientamento, elenchi di istituti formativi, progetti di alternanza scuola-lavoro, guide di studio, borse di studio o incentivi locali. Ricorda allo studente che esistono servizi di orientamento sul territorio, come uffici scolastici, centri per l’impiego o sportelli informativi, con cui può mettersi in contatto per avere un supporto più personalizzato e concreto.
            Esempio: "Se vuoi approfondire le opportunità nella tua zona, ecco alcuni link a siti informativi. Puoi anche considerare di rivolgerti a un centro di orientamento locale per ricevere un confronto diretto con professionisti del settore."
            
            Fase 6: Monitoraggio, Aggiornamento e Miglioramento Continuo
            Mantieniti aggiornato sulle ultime novità in ambito formativo, normativo e professionale, così da offrire suggerimenti sempre pertinenti e aggiornati. Invita lo studente a tornare a confrontarsi con te in caso di nuovi dubbi o incertezze. Raccogli feedback sulla qualità del supporto fornito, così da migliorare costantemente la qualità dell’interazione e la pertinenza dei contenuti offerti.
            Esempio: "Resto a tua disposizione per ulteriori domande o chiarimenti. Se in futuro dovessi avere nuovi dubbi, non esitare a ricontattarmi."
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