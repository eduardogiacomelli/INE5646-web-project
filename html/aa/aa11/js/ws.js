document.addEventListener('DOMContentLoaded', () => {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const startServerBtn = document.getElementById('startServerBtn');
    const stopServerBtn = document.getElementById('stopServerBtn');
    const clearMessagesBtn = document.getElementById('clearMessagesBtn');
    const tcpCountEl = document.getElementById('tcpCount');
    const udpCountEl = document.getElementById('udpCount');
    const totalCountEl = document.getElementById('totalCount');
    const messageTabs = document.querySelectorAll('.message-tabs .tab');
    const messageList = document.getElementById('messageList');
    const toggleDebugBtn = document.getElementById('toggleDebugBtn');
    const debugInfo = document.getElementById('debugInfo');

    let tcpMessages = 0;
    let udpMessages = 0;
    let totalMessages = 0;
    let currentFilter = 'all';
    let messagesStore = [];
    let websocket = null;
    let currentServerCGIStatus = 'unknown'; // From server_manager.py: 'running', 'stopped', 'error_...'
    let webSocketVisualState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'

    const websocketHost = window.location.hostname;
    const websocketPort = 8082;
    const websocketUrl = `ws://${websocketHost}:${websocketPort}`;
    const cgiScriptUrl = 'py/server_manager.py';

    function logDebug(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = document.createElement('div');
        let fullMessage = `[${timestamp}] ${message}`;
        if (data !== null && typeof data !== 'undefined') {
            try {
                const dataStr = (typeof data === 'object') ? JSON.stringify(data) : String(data);
                fullMessage += ` :: ${dataStr.length > 300 ? dataStr.substring(0, 300) + '...' : dataStr}`;
            } catch (e) { fullMessage += ` :: (Unserializable data for logging)`; }
        }
        logEntry.textContent = fullMessage;
        if (debugInfo.firstChild) debugInfo.insertBefore(logEntry, debugInfo.firstChild);
        else debugInfo.appendChild(logEntry);
        console.log(`[Debug] ${message}`, data !== null ? data : '');
    }

    function updateCombinedStatusUI() {
        let displayText = 'Desconhecido';
        let dotClass = 'offline'; // Default dot class

        switch (currentServerCGIStatus) {
            case 'running':
            case 'started':
            case 'already_running':
                displayText = 'Servidor Online';
                dotClass = 'online';
                startServerBtn.disabled = true;
                stopServerBtn.disabled = false;
                if (webSocketVisualState === 'connected') {
                    displayText += ' (WS Conectado)';
                    dotClass = 'online ws-connected'; // Specific style for WS connected
                } else if (webSocketVisualState === 'connecting') {
                    displayText += ' (WS Conectando...)';
                    dotClass = 'checking ws-connecting'; // Optional: style for WS connecting
                } else if (webSocketVisualState === 'error') {
                    displayText += ' (WS Erro)';
                    dotClass = 'online ws-error'; // Server is on, but WS has issues
                } else { // disconnected or unknown WS state while server is running
                    displayText += ' (WS Desconectado)';
                }
                break;
            case 'stopped':
            case 'not_running':
            case 'already_stopped':
                displayText = 'Servidor Offline';
                dotClass = 'offline';
                startServerBtn.disabled = false;
                stopServerBtn.disabled = true;
                webSocketVisualState = 'disconnected'; // WS cannot be connected if server is stopped
                break;
            case 'starting':
                displayText = 'Iniciando servidor...';
                dotClass = 'checking';
                startServerBtn.disabled = true;
                stopServerBtn.disabled = true;
                break;
            case 'stopping':
                displayText = 'Parando servidor...';
                dotClass = 'checking';
                startServerBtn.disabled = true;
                stopServerBtn.disabled = true;
                break;
            case 'error': // This is for critical CGI errors
            case 'error_starting': // And other specific error statuses from server_manager.py
            default:
                displayText = `Erro no Servidor`;
                if (typeof currentServerCGIStatus === 'string' && currentServerCGIStatus.startsWith('error_') && typeof lastCGIMessage === 'string') {
                     displayText = `Erro: ${lastCGIMessage || currentServerCGIStatus}`;
                } else if (typeof lastCGIMessage === 'string') {
                     displayText = `Erro: ${lastCGIMessage}`;
                }
                dotClass = 'offline'; // Treat as offline for controls
                startServerBtn.disabled = false;
                stopServerBtn.disabled = true;
                webSocketVisualState = 'disconnected';
                break;
        }
        statusText.textContent = displayText;
        statusDot.className = 'status-dot ' + dotClass; // Set dot class
        logDebug(`UI Updated: Text='${statusText.textContent}', DotClass='${statusDot.className}'`);
    }
    
    let lastCGIMessage = ""; // Store last message from CGI for error display

    async function manageServer(action) {
        logDebug(`CGI Request: action=${action}`);
        if (action === 'start') currentServerCGIStatus = 'starting';
        else if (action === 'stop') currentServerCGIStatus = 'stopping';
        else currentServerCGIStatus = 'checking';
        updateCombinedStatusUI(); // Update UI based on action being initiated

        try {
            const response = await fetch(`${cgiScriptUrl}?action=${action}`, { cache: "no-store" });
            const responseText = await response.text();
            logDebug(`CGI Raw Response (${action}): HTTP ${response.status}`, responseText.substring(0, 500));

            if (!response.ok) {
                lastCGIMessage = `HTTP ${response.status}: ${responseText.substring(0, 100)}`;
                throw new Error(lastCGIMessage);
            }
            
            const data = JSON.parse(responseText);
            logDebug(`CGI Parsed JSON (${action}):`, data);
            lastCGIMessage = data.message || data.status; // Store message from successful JSON
            currentServerCGIStatus = data.status || 'error'; // Update with actual status from server
            updateCombinedStatusUI(); // Update UI with new server state

            if (currentServerCGIStatus === 'running' || currentServerCGIStatus === 'started' || currentServerCGIStatus === 'already_running') {
                setTimeout(connectWebSocket, 250); // Give server a tiny moment before WS connect
            } else {
                disconnectWebSocket(); // Ensure WS is disconnected if server is not running
            }
            return data;
        } catch (error) {
            logDebug(`CGI Error (${action}): ${error.message}`, error);
            lastCGIMessage = error.message || 'Falha na comunicação ou JSON inválido.';
            currentServerCGIStatus = 'error';
            updateCombinedStatusUI();
            disconnectWebSocket();
            return { status: 'error', message: error.message };
        }
    }

    function connectWebSocket() {
        if (currentServerCGIStatus !== 'running' && currentServerCGIStatus !== 'started' && currentServerCGIStatus !== 'already_running') {
            logDebug("WS: Server not in a runnable state, not attempting WebSocket connection.");
            disconnectWebSocket(); // Make sure it's marked as disconnected
            return;
        }
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            logDebug("WS: connectWebSocket() called, but already connected.");
            webSocketVisualState = 'connected';
            updateCombinedStatusUI();
            return;
        }
        if (websocket && websocket.readyState === WebSocket.CONNECTING) {
            logDebug("WS: connectWebSocket() called, but connection already in progress.");
            return;
        }

        logDebug(`WS: Attempting to connect to ${websocketUrl}...`);
        webSocketVisualState = 'connecting';
        updateCombinedStatusUI();
        websocket = new WebSocket(websocketUrl);

        websocket.onopen = () => {
            logDebug("WS: Connection OPENED successfully!");
            webSocketVisualState = 'connected';
            updateCombinedStatusUI();
        };

        websocket.onmessage = (event) => {
            try {
                const msgData = JSON.parse(event.data);
                logDebug(`WS: Message received:`, msgData);
                // Check for specific system messages from server.py
                if (msgData.type === 'system' && msgData.event === 'connected') {
                    logDebug(`WS: Connection confirmation from server: ${msgData.message}`);
                    // UI already updated by onopen generally
                } else {
                    addMessageToDOM(msgData);
                }
            } catch (e) {
                logDebug(`WS: Error processing received JSON message: ${e} - Raw Data: ${event.data}`, true);
            }
        };

        websocket.onerror = (errorEvent) => {
            logDebug(`WS: Connection ERROR.`, errorEvent);
            webSocketVisualState = 'error';
            updateCombinedStatusUI();
        };

        websocket.onclose = (event) => {
            logDebug(`WS: Connection CLOSED. Code: ${event.code}, Reason: '${event.reason || 'N/A'}', Clean: ${event.wasClean}`);
            webSocketVisualState = 'disconnected';
            updateCombinedStatusUI(); // Update main UI to reflect WS disconnected
            websocket = null;
        };
    }
    
    function disconnectWebSocket(reason = "Client requested disconnect") {
        if (websocket) {
            logDebug(`WS: Closing WebSocket. Reason: ${reason}`);
            websocket.onclose = null; // Prevent onclose from triggering further actions if we are manually closing
            websocket.close(1000, reason);
            websocket = null;
        }
        webSocketVisualState = 'disconnected';
        updateCombinedStatusUI(); // Reflect disconnection immediately
    }

    function addMessageToDOM(msgData) {
        const noMessagesEl = messageList.querySelector('.no-messages');
        if (noMessagesEl) noMessagesEl.remove();
        messagesStore.push(msgData); 
        if (msgData.type === 'tcp') tcpMessages++;
        else if (msgData.type === 'udp') udpMessages++;
        totalMessages++;
        if(tcpCountEl) tcpCountEl.textContent = tcpMessages;
        if(udpCountEl) udpCountEl.textContent = udpMessages;
        if(totalCountEl) totalCountEl.textContent = totalMessages;
        if (currentFilter === 'all' || currentFilter === msgData.type) {
            renderSingleMessage(msgData, true);
        }
    }
    
    function renderSingleMessage(msgData, prepend = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', msgData.type); 
        const parsedDate = new Date(msgData.timestamp);
        const localDate = parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
        const localTime = parsedDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="protocol-badge ${msgData.type}-badge">${escapeHtml(msgData.type).toUpperCase()}</span>
                <span>IP: ${escapeHtml(msgData.ip)}:${escapeHtml(String(msgData.port))}</span>
                <span>${localDate} ${localTime}</span>
            </div>
            <div class="message-content">${escapeHtml(msgData.data)}</div>`;
        if (prepend) messageList.insertBefore(messageDiv, messageList.firstChild); 
        else messageList.appendChild(messageDiv);
    }

    function renderAllMessages() {
        messageList.innerHTML = ''; 
        const filteredMessages = messagesStore.filter(msg => currentFilter === 'all' || msg.type === currentFilter);
        if (filteredMessages.length === 0) {
            messageList.innerHTML = '<div class="no-messages">Nenhuma mensagem para exibir com o filtro atual.</div>';
            return;
        }
        filteredMessages.slice().reverse().forEach(msgData => renderSingleMessage(msgData, true));
        messageList.scrollTop = 0; 
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return unsafe.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // --- Event Listeners ---
    if(startServerBtn) startServerBtn.addEventListener('click', () => manageServer('start'));
    if(stopServerBtn) stopServerBtn.addEventListener('click', () => manageServer('stop'));

    if(clearMessagesBtn) clearMessagesBtn.addEventListener('click', () => {
        logDebug("Limpando mensagens...");
        messagesStore = [];
        tcpMessages = 0; udpMessages = 0; totalMessages = 0;
        if(tcpCountEl) tcpCountEl.textContent = '0';
        if(udpCountEl) udpCountEl.textContent = '0';
        if(totalCountEl) totalCountEl.textContent = '0';
        renderAllMessages(); 
    });

    if(messageTabs) messageTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            messageTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            logDebug(`Filtro de mensagem alterado para: ${currentFilter}`);
            renderAllMessages();
        });
    });

    if(toggleDebugBtn) toggleDebugBtn.addEventListener('click', () => {
        const isHidden = debugInfo.style.display === 'none' || debugInfo.style.display === '';
        debugInfo.style.display = isHidden ? 'block' : 'none';
        toggleDebugBtn.textContent = isHidden ? 'Ocultar Logs' : 'Mostrar Logs';
    });

    function initializePage() {
        logDebug("Página inicializada. Verificando status do servidor...");
        manageServer('status'); 
    }

    // Ensure all critical elements are present before initializing
    const essentialElements = [statusDot, statusText, startServerBtn, stopServerBtn, clearMessagesBtn, 
                               tcpCountEl, udpCountEl, totalCountEl, messageList, toggleDebugBtn, debugInfo];
    if (essentialElements.every(el => el !== null) && messageTabs.length > 0) {
        initializePage();
    } else {
        const missing = essentialElements.map((el, i) => el === null ? ["statusDot", "statusText", "startServerBtn", "stopServerBtn", "clearMessagesBtn", "tcpCountEl", "udpCountEl", "totalCountEl", "messageList", "toggleDebugBtn", "debugInfo"][i] : null).filter(Boolean).join(", ");
        let criticalErrorMsg = `JS Error: Elementos DOM essenciais não encontrados: ${missing}.`;
        if (messageTabs.length === 0) criticalErrorMsg += " messageTabs também não encontrado ou vazio.";
        console.error(criticalErrorMsg);
        alert("Erro crítico: A página não pôde ser inicializada. Verifique o console (F12).");
    }
});
