// Video Caption Generator - Main Application Module

// Global state management
export const AppState = {
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
    },
    
    reset() {
        this.currentVideo = null;
        this.currentCaptions = [];
        this.currentStyle = 'bottom';
    }
};

// Application Initialization
export const App = (() => {
    const init = async () => {
        try {
            // Initialize all components
            const { VideoUploader } = await import('./uploader.js');
            VideoUploader.init();
            
            console.log('🚀 Video Caption Generator initialized');
            console.log('📱 Modular component architecture loaded');
            console.log('🎤 Whisper.cpp integration ready');
            console.log('🚫 Remotion Studio integration removed');
            console.log('⚡ FFmpeg rendering enabled');
        } catch (error) {
            console.error('Failed to initialize application:', error);
        }
    };
    
    const getState = () => AppState;
    
    return {
        init,
        getState
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
