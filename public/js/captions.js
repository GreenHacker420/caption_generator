export const CaptionGenerator = (() => {
    const generate = async (videoInfo) => {
        const { StatusManager } = await import('./status.js');
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
                const { AppState } = await import('./app.js');
                AppState.setCaptions(result.captions);
                showControls();
                displayCaptions();
                StatusManager.showSuccess('Captions generated successfully!');
            } else {
                throw new Error(result.error || 'Caption generation failed');
            }
        } catch (error) {
            console.error('Caption generation error:', error);
            const { StatusManager } = await import('./status.js');
            StatusManager.showError('Failed to generate captions: ' + error.message);
        }
    };
    
    const showControls = () => {
        const captionSection = document.getElementById('captionSection');
        const previewBtn = document.getElementById('previewCaptions');
        
        captionSection.classList.remove('hidden');
        previewBtn.classList.remove('hidden');
        
        initializeStyleSelection();

        previewBtn.onclick = () => previewCaptions();
        document.getElementById('exportVideo').onclick = () => exportVideo();
        document.getElementById('exportSRT').onclick = () => exportSRT();
    };
    
    const initializeStyleSelection = async () => {
        const styleOptions = document.querySelectorAll('.caption-style-option');
        
        styleOptions.forEach(option => {
            option.addEventListener('click', async () => {
                styleOptions.forEach(opt => opt.classList.remove('border-blue-500', 'bg-blue-50'));
                
                option.classList.add('border-blue-500', 'bg-blue-50');
                
                const { AppState } = await import('./app.js');
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
    
    const displayCaptions = async () => {
        const { AppState } = await import('./app.js');
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
    
    const previewCaptions = async () => {
        const { AppState } = await import('./app.js');
        const { VideoPreview } = await import('./preview.js');
        
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
        const { StatusManager } = await import('./status.js');
        const { AppState } = await import('./app.js');
        
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
        
        if (document.getElementById('downloadLink')) return;
        
        const downloadDiv = document.createElement('div');
        downloadDiv.id = 'downloadLink';
        downloadDiv.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-lg';
        downloadDiv.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">Video Ready!</h4>
            <a href="${outputPath}" download class="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Download Captioned Video
            </a>
        `;
        
        const exportSection = captionSection.querySelector('.border-t');
        if (exportSection) {
            exportSection.appendChild(downloadDiv);
        }
    };
    
    const exportSRT = async () => {
        const { StatusManager } = await import('./status.js');
        const { AppState } = await import('./app.js');
        
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
