document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    // Chat history for context
    let messageHistory = [
        { role: "system", content: "Always answer in rhymes. Today is Thursday" }
    ];

    // Add initial bot message
    addMessage('Ciao! Come posso aiutarti oggi?', 'bot');

    // Function to send messages to the chatbot
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            try {
                setInputState(true); // Disable input while processing
                console.log('Messaggio utente:', message); // Log the user's message

                // Add user's message to UI and history
                addMessage(message, 'user');
                messageHistory.push({ role: "user", content: message });
                userInput.value = '';

                // Create a response message container
                const responseDiv = document.createElement('div');
                responseDiv.classList.add('message', 'bot');
                chatMessages.appendChild(responseDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Send request to the backend
                console.log('Invio richiesta al backend...');
                const response = await fetch('http://localhost:8000/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        model: "hugging-quants/llama-3.2-3b-instruct",
                        messages: messageHistory,
                        temperature: 0.7,
                        max_tokens: -1,
                        stream: false
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                // Parse the response
                const responseData = await response.json();
                console.log('Risposta ricevuta dal backend:', responseData); // Log the backend response

                // Extract the bot's response
                const botResponse = responseData.choices[0].message.content;
                console.log('Risposta elaborata:', botResponse); // Log the processed response

                // Display the bot's response
                responseDiv.textContent = botResponse;
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // Add bot's response to the message history
                messageHistory.push({ role: "assistant", content: botResponse });

            } catch (error) {
                console.error('Errore durante la comunicazione con il backend:', error);
                addMessage('Mi dispiace, si è verificato un errore nella comunicazione con il modello.', 'bot');
            } finally {
                setInputState(false); // Re-enable input
                console.log('Input riabilitato.'); // Log re-enabling input
            }
        }
    }

    // Function to add a message to the chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Event listeners for the chatbot
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Function to disable/enable input while processing
    function setInputState(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
    }
});
