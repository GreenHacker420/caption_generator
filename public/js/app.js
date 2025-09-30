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


export const App = (() => {
    const init = async () => {
        try {
            const { VideoUploader } = await import('./uploader.js');
            VideoUploader.init();
            
            console.log('Video Caption Generator initialized');
            console.log('Modular component architecture loaded');
            console.log('Whisper.cpp integration ready');
            console.log('Remotion Studio integration removed');
            console.log('FFmpeg rendering enabled');
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

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
