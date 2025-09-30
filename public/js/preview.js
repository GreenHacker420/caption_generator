export const VideoPreview = (() => {
    const show = async (videoInfo) => {
        const videoSection = document.getElementById('videoSection');
        const videoPreview = document.getElementById('videoPreview');
        
        videoPreview.src = videoInfo.url;
        videoSection.classList.remove('hidden');
        
        const generateBtn = document.getElementById('generateCaptions');
        generateBtn.onclick = async () => {
            const { CaptionGenerator } = await import('./captions.js');
            CaptionGenerator.generate(videoInfo);
        };
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
