export const StatusManager = (() => {
    const showMessage = (message, type, duration = 3000) => {
        const statusMessage = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        if (!statusMessage || !statusText) return;
        
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            error: 'bg-red-600'
        };
        
        statusText.textContent = message;
        statusMessage.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg`;
        statusMessage.classList.remove('hidden');
        
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, duration);
    };
    
    const showStatus = (message) => {
        showMessage(message, 'info');
    };
    
    const showSuccess = (message) => {
        showMessage(message, 'success');
    };
    
    const showError = (message) => {
        showMessage(message, 'error', 5000);
    };
    
    return {
        showStatus,
        showSuccess,
        showError
    };
})();
