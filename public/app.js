// Video Caption Generator - Component-based ES6 Application

class VideoUploader {
    constructor() {
        this.uploadZone = document.getElementById('uploadZone');
        this.videoInput = document.getElementById('videoInput');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.currentVideo = null;
        
        this.initializeEvents();
    }
    
    initializeEvents() {
        // Click to upload
        this.uploadZone.addEventListener('click', () => {
            this.videoInput.click();
        });
        
        // File input change
        this.videoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
        
        // Drag and drop
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });
        
        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });
        
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('video/')) {
                this.handleFileUpload(files[0]);
            }
        });
    }
    
    async handleFileUpload(file) {
        if (!file.type.startsWith('video/')) {
            StatusManager.showError('Please select a valid video file');
            return;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            StatusManager.showError('File size must be less than 100MB');
            return;
        }
        
        this.showProgress();
        
        const formData = new FormData();
        formData.append('video', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentVideo = result.video;
                this.hideProgress();
                VideoPreview.showVideo(result.video);
                StatusManager.showSuccess('Video uploaded successfully!');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.hideProgress();
            StatusManager.showError('Failed to upload video: ' + error.message);
        }
    }
    
    showProgress() {
        this.uploadProgress.classList.remove('hidden');
        // Simulate progress for now
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 95) {
                progress = 95;
                clearInterval(interval);
            }
            this.progressBar.style.width = progress + '%';
            this.progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        }, 200);
    }
    
    hideProgress() {
        this.uploadProgress.classList.add('hidden');
        this.progressBar.style.width = '0%';
    }
    
    getCurrentVideo() {
        return this.currentVideo;
    }
}

class VideoPreview {
    static showVideo(videoInfo) {
        const videoSection = document.getElementById('videoSection');
        const videoPreview = document.getElementById('videoPreview');
        
        videoPreview.src = videoInfo.url;
        videoSection.classList.remove('hidden');
        
        // Initialize caption generation button
        const generateBtn = document.getElementById('generateCaptions');
        generateBtn.onclick = () => CaptionGenerator.generateCaptions(videoInfo);
    }
    
    static showCaptionOverlay(text, style = 'bottom') {
        const overlay = document.getElementById('captionOverlay');
        overlay.textContent = text;
        overlay.className = `caption-preview caption-${style} hinglish-text`;
        overlay.classList.remove('hidden');
    }
    
    static hideCaptionOverlay() {
        const overlay = document.getElementById('captionOverlay');
        overlay.classList.add('hidden');
    }
}

class CaptionGenerator {
    static currentCaptions = [];
    static currentStyle = 'bottom';
    
    static async generateCaptions(videoInfo) {
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
                this.currentCaptions = result.captions;
                this.showCaptionControls();
                this.displayCaptions();
                StatusManager.showSuccess('Captions generated successfully!');
                
                // Automatically open Remotion studio with captions
                this.openStudioWithCaptions(uploader.getCurrentVideo());
            } else {
                throw new Error(result.error || 'Caption generation failed');
            }
        } catch (error) {
            console.error('Caption generation error:', error);
            StatusManager.showError('Failed to generate captions: ' + error.message);
        }
    }
    
    static showCaptionControls() {
        const captionSection = document.getElementById('captionSection');
        const previewBtn = document.getElementById('previewCaptions');
        
        captionSection.classList.remove('hidden');
        previewBtn.classList.remove('hidden');
        
        // Initialize style selection
        this.initializeStyleSelection();
        
        // Initialize preview button
        previewBtn.onclick = () => this.previewCaptions();
        
        // Initialize export buttons
        document.getElementById('exportVideo').onclick = () => this.exportVideo();
        document.getElementById('exportSRT').onclick = () => this.exportSRT();
    }
    
    static initializeStyleSelection() {
        const styleOptions = document.querySelectorAll('.caption-style-option');
        
        styleOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                styleOptions.forEach(opt => opt.classList.remove('border-blue-500', 'bg-blue-50'));
                
                // Add active class to selected option
                option.classList.add('border-blue-500', 'bg-blue-50');
                
                // Update current style
                this.currentStyle = option.dataset.style;
                
                // Update preview if captions are showing
                if (!document.getElementById('captionOverlay').classList.contains('hidden')) {
                    this.previewCaptions();
                }
            });
        });
        
        // Set default selection
        styleOptions[0].click();
    }
    
    static displayCaptions() {
        const captionList = document.getElementById('captionList');
        
        if (this.currentCaptions.length === 0) {
            captionList.innerHTML = '<p class="text-gray-500 text-center">No captions found</p>';
            return;
        }
        
        const captionsHTML = this.currentCaptions.map((caption, index) => `
            <div class="caption-item border-b border-gray-200 py-3 last:border-b-0">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-sm font-medium text-gray-600">#${caption.index}</span>
                    <span class="text-sm text-gray-500">${this.formatTime(caption.startTime)} → ${this.formatTime(caption.endTime)}</span>
                </div>
                <p class="hinglish-text text-gray-800">${caption.text}</p>
            </div>
        `).join('');
        
        captionList.innerHTML = captionsHTML;
    }
    
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    static previewCaptions() {
        if (this.currentCaptions.length === 0) return;
        
        const video = document.getElementById('videoPreview');
        let currentCaptionIndex = 0;
        
        const updateCaption = () => {
            const currentTime = video.currentTime;
            const caption = this.currentCaptions.find(cap => 
                currentTime >= cap.startTime && currentTime <= cap.endTime
            );
            
            if (caption) {
                VideoPreview.showCaptionOverlay(caption.text, this.currentStyle);
            } else {
                VideoPreview.hideCaptionOverlay();
            }
        };
        
        // Update captions as video plays
        video.addEventListener('timeupdate', updateCaption);
        
        // Show first caption as preview
        if (this.currentCaptions[0]) {
            VideoPreview.showCaptionOverlay(this.currentCaptions[0].text, this.currentStyle);
        }
    }
    
    static async exportVideo() {
        // Show progress indicator
        StatusManager.showStatus('🔄 Converting video to compatible format...');
        
        try {
            const videoInfo = uploader.getCurrentVideo();
            
            // Add timeout for long operations
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
            
            const response = await fetch('/api/render-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoPath: videoInfo.path,
                    captions: this.currentCaptions,
                    style: this.currentStyle
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
                StatusManager.showSuccess(`✅ Video exported successfully!`);
                
                // Add download link
                this.addDownloadLink(result.outputPath);
            } else {
                throw new Error(result.error || 'Export failed');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                StatusManager.showError('❌ Export timeout - video may be too large or complex');
            } else {
                console.error('Export error:', error);
                StatusManager.showError(`❌ Export failed: ${error.message}`);
            }
        }
    }
    
    static addDownloadLink(outputPath) {
        const captionSection = document.getElementById('captionSection');
        
        // Check if download link already exists
        if (document.getElementById('downloadLink')) return;
        
        const downloadDiv = document.createElement('div');
        downloadDiv.id = 'downloadLink';
        downloadDiv.className = 'mt-4 p-4 bg-green-50 border border-green-200 rounded-lg';
        downloadDiv.innerHTML = `
            <h4 class="font-medium text-green-800 mb-2">🎉 Video Ready!</h4>
            <a href="${outputPath}" download class="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                📥 Download Captioned Video
            </a>
        `;
        
        // Add after export section
        const exportSection = captionSection.querySelector('.border-t');
        exportSection.appendChild(downloadDiv);
    }
    
    static exportSRT() {
        if (this.currentCaptions.length === 0) {
            StatusManager.showError('No captions to export');
            return;
        }
        
        const srtContent = this.currentCaptions.map(caption => {
            const startTime = this.secondsToSRTTime(caption.startTime);
            const endTime = this.secondsToSRTTime(caption.endTime);
            
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
    }
    
    static secondsToSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }
    
    static async openStudioWithCaptions(videoInfo) {
        try {
            StatusManager.showStatus('Opening Remotion Studio with your captions...');
            
            const response = await fetch('/api/open-studio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoPath: videoInfo.path,
                    captions: this.currentCaptions,
                    style: this.currentStyle
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                StatusManager.showSuccess('Remotion Studio is opening! Check http://localhost:3001');
                
                // Add a button to open studio in new tab
                this.addStudioButton(result.studioUrl);
            } else {
                throw new Error(result.error || 'Failed to open studio');
            }
        } catch (error) {
            console.error('Studio open error:', error);
            StatusManager.showError('Failed to open studio: ' + error.message);
        }
    }
    
    static addStudioButton(studioUrl) {
        const captionSection = document.getElementById('captionSection');
        
        // Check if button already exists
        if (document.getElementById('openStudioBtn')) return;
        
        const studioButton = document.createElement('button');
        studioButton.id = 'openStudioBtn';
        studioButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors ml-4';
        studioButton.innerHTML = '🎬 Open Remotion Studio';
        studioButton.onclick = () => {
            window.open('http://localhost:3001', '_blank');
        };
        
        // Add to export section
        const exportSection = captionSection.querySelector('.border-t');
        const buttonContainer = exportSection.querySelector('.flex');
        buttonContainer.appendChild(studioButton);
    }
}

class StatusManager {
    static showStatus(message) {
        const statusMessage = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        statusMessage.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg';
        statusMessage.classList.remove('hidden');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 3000);
    }
    
    static showSuccess(message) {
        const statusMessage = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        statusMessage.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg';
        statusMessage.classList.remove('hidden');
        
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 3000);
    }
    
    static showError(message) {
        const statusMessage = document.getElementById('statusMessage');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        statusMessage.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg';
        statusMessage.classList.remove('hidden');
        
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the application
let uploader;

document.addEventListener('DOMContentLoaded', () => {
    uploader = new VideoUploader();
    console.log('🚀 Video Caption Generator initialized');
    console.log('📱 Component-based ES6 architecture loaded');
    console.log('🎤 Whisper.cpp integration ready');
});
