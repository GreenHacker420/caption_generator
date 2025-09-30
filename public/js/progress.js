export const ProgressBar = (() => {
    const show = (element, text = 'Processing...') => {
        if (!element) return;
        
        element.classList.remove('hidden');
        
        const progressBar = element.querySelector('.progress-bar') || element.querySelector('[role="progressbar"]');
        const progressText = element.querySelector('.progress-text');
        
        if (progressText) {
            progressText.textContent = text;
        }
        
        return {
            update: (percentage) => {
                if (progressBar) {
                    progressBar.style.width = `${percentage}%`;
                }
                if (progressText) {
                    progressText.textContent = `${text} ${Math.round(percentage)}%`;
                }
            },
            hide: () => {
                element.classList.add('hidden');
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }
        };
    };
    
    const hide = (element) => {
        if (!element) return;
        
        element.classList.add('hidden');
        
        const progressBar = element.querySelector('.progress-bar') || element.querySelector('[role="progressbar"]');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    };
    
    const simulate = (element, text = 'Processing...', duration = 2000) => {
        const progress = show(element, text);
        if (!progress) return;
        
        let percentage = 0;
        const increment = 100 / (duration / 100);
        
        const interval = setInterval(() => {
            percentage += Math.random() * increment;
            if (percentage >= 95) {
                percentage = 95;
                clearInterval(interval);
            }
            progress.update(percentage);
        }, 100);
        
        return {
            complete: () => {
                clearInterval(interval);
                progress.update(100);
                setTimeout(() => progress.hide(), 500);
            },
            hide: () => {
                clearInterval(interval);
                progress.hide();
            }
        };
    };
    
    return {
        show,
        hide,
        simulate
    };
})();
