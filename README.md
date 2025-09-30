# Video Caption Generator

A local web application that automatically generates captions for MP4 videos using Whisper.cpp and renders them with Remotion. Supports Hinglish (Hindi + English) text with proper font rendering.

## ✨ Features

- 📁 **Video Upload**: Drag & drop or browse MP4 files (up to 100MB)
- 🎤 **Local Speech-to-Text**: Uses Whisper.cpp for offline caption generation
- 🌍 **Hinglish Support**: Proper rendering of Hindi + English mixed text
- 🎨 **Multiple Caption Styles**: 
  - Bottom Centered (classic subtitles)
  - Top Bar (news-style overlay)
  - Karaoke Style (colorful gradient text)
- 👁️ **Real-time Preview**: See captions overlaid on video
- 🎬 **FFmpeg Video Rendering**: Direct subtitle burning for maximum compatibility
- 📄 **SRT Export**: Download caption files in SRT format
- ⚡ **Functional Components**: Clean, modular vanilla JavaScript architecture

## Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **FFmpeg** (for audio extraction and video rendering)
- **macOS/Linux** (Whisper.cpp compiled for Unix systems)

### Installation

1. **Clone and setup**:
   ```bash
   cd /Users/greenhacker/Desktop/experiments/caption/caption
   npm install
   ```

2. **Verify Whisper.cpp is built**:
   ```bash
   ls whisper.cpp/build/bin/whisper-cli  # Should exist
   ls whisper.cpp/models/ggml-base.bin  # Should exist
   ```

3. **Install FFmpeg** (if not already installed):
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   ```

4. **Verify FFmpeg installation**:
   ```bash
   ffmpeg -version  # Should show version info with libx264 and subtitle support
   ```

### Running the Application

1. **Start the server**:
   ```bash
   npm run app
   ```

2. **Open your browser**:
   ```
   http://localhost:3000
   ```

3. **Upload and process videos**:
   - Drag & drop an MP4 file or click to browse
   - Click "Generate Captions" to process with Whisper.cpp
   - Select a caption style (Bottom, Top Bar, or Karaoke)
   - Preview captions on the video
   - Export final video with captions (uses FFmpeg for reliability)

## Architecture

### Functional Component Architecture

- **VideoUploader**: Handles file upload with drag & drop using IIFE pattern
- **VideoPreview**: Displays video with caption overlay
- **CaptionGenerator**: Integrates with Whisper.cpp for STT
- **StatusManager**: User feedback and notifications
- **AppState**: Centralized state management

### Backend Integration

- **Express Server**: Unified frontend/backend in single app
- **Whisper.cpp Integration**: Local speech-to-text processing
- **FFmpeg Rendering**: Direct subtitle burning for video export
- **File Management**: Upload/output handling

### Key Improvements

- **No React Dependencies**: Pure vanilla JavaScript with functional patterns
- **Modular Design**: Each component is self-contained with clear interfaces
- **Simplified Architecture**: Removed Remotion complexity, using FFmpeg directly
- **Better Performance**: Lighter weight without React/Remotion overhead

## Usage Examples

### Basic Workflow

1. Upload MP4 video
2. Generate captions automatically
3. Choose caption style
4. Preview result
5. Export final video

### Supported Text

The app properly handles:
- **English**: "Hello world"
- **Hindi**: "नमस्ते दुनिया"
- **Hinglish**: "Hello दुनिया, how are you आज?"

## Development

### Project Structure

```
caption/
├── server.js              # Main Express server
├── public/
│   ├── index.html         # Web interface
│   └── app.js            # Frontend components
├── src/
│   ├── Root.jsx          # Remotion compositions
│   └── CaptionedVideo/   # Caption rendering components
├── whisper.cpp/          # Local Whisper.cpp installation
├── uploads/              # Uploaded videos
└── outputs/              # Rendered videos
```

### Available Scripts

- `npm run app` - Start the web application
- `npm run dev` - Start Remotion studio for development
- `npm run build` - Build Remotion bundle

### API Endpoints

- `POST /api/upload` - Upload video file
- `POST /api/generate-captions` - Generate captions with Whisper.cpp
- `POST /api/open-studio` - Open Remotion Studio with captions
- `POST /api/render-video` - Render video with captions (FFmpeg primary, Remotion fallback)

## Caption Styles

### Bottom Centered
Classic subtitle style at the bottom of the video with white text and shadow.

### Top Bar
News-style overlay at the top with dark background for better readability.

### Karaoke Style
Colorful gradient text with bold styling for entertainment content.

## Hinglish Font Support

Uses Google Fonts:
- **Noto Sans Devanagari**: For Hindi characters (देवनागरी)
- **Noto Sans**: For English characters
- **Automatic fallback**: Seamless mixed-language rendering

## 🔧 Troubleshooting

### Common Issues

1. **Whisper model not found**:
   ```bash
   cd whisper.cpp/models
   bash download-ggml-model.sh base
   ```

2. **FFmpeg not installed**:
   ```bash
   brew install ffmpeg  # macOS
   ```

3. **Permission errors**:
   ```bash
   chmod +x whisper.cpp/build/bin/whisper-cli
   ```

4. **Video export fails**:
   - **Primary Solution**: Uses FFmpeg for direct subtitle burning (most reliable)
   - **Fallback**: Remotion rendering if FFmpeg fails
   - **Check**: Ensure FFmpeg has subtitle support: `ffmpeg -filters | grep subtitle`

5. **Large files in Git**:
   ```bash
   # Remove large video files from Git
   git rm --cached uploads/*.mp4 outputs/*.mp4
   git commit -m "Remove large video files"
   ```

6. **Remotion PIPELINE_ERROR_DECODE**:
   - **Fixed**: Now uses FFmpeg as primary rendering method
   - **Cause**: Video codec compatibility issues with Chromium
   - **Solution**: FFmpeg directly burns subtitles into video

### Performance Tips

- Use smaller video files for faster processing
- Base model provides good balance of speed/accuracy
- Ensure sufficient disk space for outputs

## Sample Output

The application generates:
- **Captioned Video**: MP4 with embedded captions
- **SRT File**: Standard subtitle format
- **Real-time Preview**: Immediate feedback

## Contributing

This is a demonstration project for Remotion captioning capabilities with local Whisper.cpp integration.

## License

UNLICENSED - Private project for internship demonstration.
