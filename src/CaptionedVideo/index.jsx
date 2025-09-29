import { useCurrentFrame, useVideoConfig, Video, AbsoluteFill } from 'remotion';
import { CaptionOverlay } from './CaptionOverlay.jsx';

export const CaptionedVideo = ({ videoSrc, captions, style = 'bottom' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Convert frame to seconds
  const currentTime = frame / fps;
  
  // Find the current caption based on time
  const currentCaption = captions.find(caption => 
    currentTime >= caption.startTime && currentTime <= caption.endTime
  );

  // Handle video errors gracefully
  const handleVideoError = (error) => {
    console.error('Video playback error:', error);
    // Don't throw, just log the error and continue
  };

  return (
    <AbsoluteFill>
      {/* Background Video */}
      <Video 
        src={videoSrc}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={handleVideoError}
        muted
        playsInline
      />
      
      {/* Caption Overlay */}
      {currentCaption && (
        <CaptionOverlay 
          text={currentCaption.text}
          style={style}
        />
      )}
    </AbsoluteFill>
  );
};
