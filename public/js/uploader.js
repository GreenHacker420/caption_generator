export const VideoUploader = (() => {
    let elements = {};
    
    const init = () => {
        elements = {
            uploadZone: document.getElementById('uploadZone'),
            videoInput: document.getElementById('videoInput'),
            uploadProgress: document.getElementById('uploadProgress'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText')
        };
        
        setupEventListeners();
    };
    
    const setupEventListeners = () => {
        elements.uploadZone.addEventListener('click', () => {
            elements.videoInput.click();
        });
        
        elements.videoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
        

        elements.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.uploadZone.classList.add('dragover');
        });
        
        elements.uploadZone.addEventListener('dragleave', () => {
            elements.uploadZone.classList.remove('dragover');
        });
        
        elements.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('video/')) {
                handleFileUpload(files[0]);
            }
        });
    };
    
    const handleFileUpload = async (file) => {
        if (!validateFile(file)) return;
        
        showProgress();
        
        const formData = new FormData();
        formData.append('video', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                const { AppState } = await import('./app.js');
                const { VideoPreview } = await import('./preview.js');
                const { StatusManager } = await import('./status.js');
                
                AppState.setVideo(result.video);
                hideProgress();
                VideoPreview.show(result.video);
                StatusManager.showSuccess('Video uploaded successfully!');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            hideProgress();
            
            const { StatusManager } = await import('./status.js');
            StatusManager.showError('Failed to upload video: ' + error.message);
        }
    };
    
    const validateFile = (file) => {
        if (!file.type.startsWith('video/')) {
            import('./status.js').then(({ StatusManager }) => {
                StatusManager.showError('Please select a valid video file');
            });
            return false;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            import('./status.js').then(({ StatusManager }) => {
                StatusManager.showError('File size must be less than 100MB');
            });
            return false;
        }
        
        return true;
    };
    
    const showProgress = () => {
        elements.uploadProgress.classList.remove('hidden');
        simulateProgress();
    };
    
    const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 95) {
                progress = 95;
                clearInterval(interval);
            }
            elements.progressBar.style.width = progress + '%';
            elements.progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        }, 200);
    };
    
    const hideProgress = () => {
        elements.uploadProgress.classList.add('hidden');
        elements.progressBar.style.width = '0%';
    };
    
    const getCurrentVideo = async () => {
        const { AppState } = await import('./app.js');
        return AppState.currentVideo;
    };
    
    return {
        init,
        getCurrentVideo
    };
})();
