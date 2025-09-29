import { AbsoluteFill } from 'remotion';

export const CaptionOverlay = ({ text, style = 'bottom' }) => {
  const getStyleConfig = () => {
    switch (style) {
      case 'top':
        return {
          position: 'absolute',
          top: 40,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          fontSize: 32,
          fontWeight: '600',
          textAlign: 'center',
          padding: '15px 30px',
          fontFamily: '"Noto Sans Devanagari", "Noto Sans", sans-serif',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          zIndex: 10
        };
      
      case 'karaoke':
        return {
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          color: 'transparent',
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 42,
          fontWeight: '700',
          textAlign: 'center',
          padding: '0 30px',
          fontFamily: '"Noto Sans Devanagari", "Noto Sans", sans-serif',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))',
          zIndex: 10
        };
      
      case 'bottom':
      default:
        return {
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          color: 'white',
          fontSize: 36,
          fontWeight: '600',
          textAlign: 'center',
          padding: '0 30px',
          fontFamily: '"Noto Sans Devanagari", "Noto Sans", sans-serif',
          textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
          lineHeight: 1.2,
          zIndex: 10
        };
    }
  };

  const styleConfig = getStyleConfig();

  return (
    <div style={styleConfig}>
      {text}
    </div>
  );
};
