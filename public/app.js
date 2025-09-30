const AppState = {
    currentVideo: null,
    currentCaptions: [],
    currentStyle: 'bottom',
    
    setVideo(video) {
        this.currentVideo = video;
    },
    
    setCaptions(captions) {
        this.currentCaptions = captions;
    },
    
    setStyle(style) {
        this.currentStyle = style;
    }
};

const VideoUploader = (() => {
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
            StatusManager.showError('Failed to upload video: ' + error.message);
        }
    };
    
    const validateFile = (file) => {
        if (!file.type.startsWith('video/')) {
            StatusManager.showError('Please select a valid video file');
            return false;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            StatusManager.showError('File size must be less than 100MB');
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
    
    return {
        init,
        getCurrentVideo: () => AppState.currentVideo
    };
})();

const VideoPreview = (() => {
    const show = (videoInfo) => {
        const videoSection = document.getElementById('videoSection');
        const videoPreview = document.getElementById('videoPreview');
        
        videoPreview.src = videoInfo.url;
        videoSection.classList.remove('hidden');
        
        const generateBtn = document.getElementById('generateCaptions');
        generateBtn.onclick = () => CaptionGenerator.generate(videoInfo);
    };
    
    const showCaptionOverlay = (text, style = 'bottom') => {
        const overlay = document.getElementById('captionOverlay');
        overlay.textContent = text;
        overlay.className = `caption-preview caption-${style} hinglish-text`;
        overlay.classList.remove('hidden');
    };
    
    const hideCaptionOverlay = () => {
        const overlay = document.getElementById('captionOverlay');
        overlay.classList.add('hidden');
    };
    
    return {
        show,
        showCaptionOverlay,
        hideCaptionOverlay
    };
})();


const CaptionGenerator = (() => {
    const generate = async (videoInfo) => {
        StatusManager.showStatus('Generating captions with Whisper.cpp...');
        
        try {
            const response = await fetch('/api/generate-captions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoPath: videoInfo.path
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                AppState.setCaptions(result.captions);
                showControls();
                displayCaptions();
                StatusManager.showSuccess('Captions generated successfully!');
            } else {
                throw new Error(result.error || 'Caption generation failed');
            }
        } catch (error) {
            console.error('Caption generation error:', error);
            StatusManager.showError('Failed to generate captions: ' + error.message);
        }
    };
    
    const showControls = () => {
        const captionSection = document.getElementById('captionSection');
        const previewBtn = document.getElementById('previewCaptions');
        
        captionSection.classList.remove('hidden');
        previewBtn.classList.remove('hidden');
        
        // Initialize style selection
        initializeStyleSelection();
        
        // Initialize buttons
        previewBtn.onclick = () => previewCaptions();
        document.getElementById('exportVideo').onclick = () => exportVideo();
        document.getElementById('exportSRT').onclick = () => exportSRT();
    };
    
    const initializeStyleSelection = () => {
        const styleOptions = document.querySelectorAll('.caption-style-option');
        
        styleOptions.forEach(option => {
            option.addEventListener('click', () => {
                styleOptions.forEach(opt => opt.classList.remove('border-blue-500', 'bg-blue-50'));
                option.classList.add('border-blue-500', 'bg-blue-50');
                AppState.setStyle(option.dataset.style);
                const overlay = document.getElementById('captionOverlay');
                if (!overlay.classList.contains('hidden')) {
                    previewCaptions();
                }
            });
        });
        
        if (styleOptions.length > 0) {
            styleOptions[0].click();
        }
    };
    
    const displayCaptions = () => {
        const captionList = document.getElementById('captionList');
        
        if (AppState.currentCaptions.length === 0) {
            captionList.innerHTML = '<p class="text-gray-500 text-center">No captions found</p>';
            return;
        }
        
        const captionsHTML = AppState.currentCaptions.map((caption) => `
            <div class="caption-item border-b border-gray-200 py-3 last:border-b-0">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-sm font-medium text-gray-600">#${caption.index}</span>
                    <span class="text-sm text-gray-500">${formatTime(caption.startTime)} → ${formatTime(caption.endTime)}</span>
                </div>
                <p class="hinglish-text text-gray-800">${caption.text}</p>
            </div>
        `).join('');
        
        captionList.innerHTML = captionsHTML;
    };
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    const previewCaptions = () => {
        if (AppState.currentCaptions.length === 0) return;
        
        const video = document.getElementById('videoPreview');
        
        const updateCaption = () => {
            const currentTime = video.currentTime;
            const caption = AppState.currentCaptions.find(cap => 
                currentTime >= cap.startTime && currentTime <= cap.endTime
            );
            
            if (caption) {
                VideoPreview.showCaptionOverlay(caption.text, AppState.currentStyle);
            } else {
                VideoPreview.hideCaptionOverlay();
            }
        };
        
        video.removeEventListener('timeupdate', updateCaption);
        video.addEventListener('timeupdate', updateCaption);
        
        if (AppState.currentCaptions[0]) {
            VideoPreview.showCaptionOverlay(AppState.currentCaptions[0].text, AppState.currentStyle);
        }
    };
    
    const exportVideo = async () => {
        StatusManager.showStatus('🎬 Rendering video with captions...');
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 3 min
            
            const response = await fetch('/api/render-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoPath: AppState.currentVideo.path,
                    captions: AppState.currentCaptions,
                    style: AppState.currentStyle
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }
            
            const result = await response.json();
            
            if (result.success) {
                StatusManager.showSuccess('Video exported successfully!');
                addDownloadLink(result.outputPath);
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                StatusManager.showError('Export timeout - video may be too large or complex');
            } else {
                console.error('Export error:', error);
                StatusManager.showError(`Export failed: ${error.message}`);
            }
        }
    };
    
    const addDownloadLink = (outputPath) => {
        const captionSection = document.getElementById('captionSection');
        
        // Check if download link already exists
        if (document.getElementById('downloadLink')) return;
        
        const downloadDiv = document.createElement('div');
        downloadDiv.id = 'downloadLink';
        downloadDiv.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-lg';
        downloadDiv.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">🎉 Video Ready!</h4>
            <a href="${outputPath}" download class="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Download Captioned Video
            </a>
        `;
        
        const exportSection = captionSection.querySelector('.border-t');
        if (exportSection) {
            exportSection.appendChild(downloadDiv);
        }
    };
    
    const exportSRT = () => {
        if (AppState.currentCaptions.length === 0) {
            StatusManager.showError('No captions to export');
            return;
        }
        
        const srtContent = AppState.currentCaptions.map(caption => {
            const startTime = secondsToSRTTime(caption.startTime);
            const endTime = secondsToSRTTime(caption.endTime);
            
            return `${caption.index}\n${startTime} --> ${endTime}\n${caption.text}\n`;
        }).join('\n');
        
        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'captions.srt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        StatusManager.showSuccess('SRT file downloaded!');
    };
    
    const secondsToSRTTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    
    return {
        generate,
        showControls,
        displayCaptions,
        previewCaptions,
        exportVideo,
        exportSRT
    };
})();
const StatusManager = (() => {
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

const App = (() => {
    const init = () => {
        VideoUploader.init();
        
        console.log('🚀 Video Caption Generator initialized');
        console.log('📱 Functional component architecture loaded');
        console.log('🎤 Whisper.cpp integration ready');
        console.log('🚫 Remotion Studio integration removed');
    };
    
    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
