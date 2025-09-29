import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/outputs', express.static('outputs'));

// Ensure uploads directory exists
await fs.ensureDir('uploads');
await fs.ensureDir('outputs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload video endpoint
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    };

    res.json({ success: true, video: videoInfo });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Generate captions using whisper.cpp
app.post('/api/generate-captions', async (req, res) => {
  try {
    const { videoPath } = req.body;
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }

    const fullVideoPath = path.join(__dirname, videoPath);
    const audioPath = path.join(__dirname, 'uploads', 'temp_audio.wav');
    const outputPath = path.join(__dirname, 'uploads', 'captions.srt');

    // Extract audio from video using ffmpeg (assuming it's installed)
    await extractAudio(fullVideoPath, audioPath);

    // Generate captions using whisper.cpp
    const captions = await generateCaptionsWithWhisper(audioPath, outputPath);

    // Clean up temporary audio file
    await fs.remove(audioPath);

    res.json({ success: true, captions });
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({ error: 'Failed to generate captions' });
  }
});

// Helper function to create SRT file from captions
const createSRTFile = async (captions, outputPath) => {
  const srtContent = captions.map(caption => {
    const startTime = secondsToSRTTime(caption.startTime);
    const endTime = secondsToSRTTime(caption.endTime);
    
    return `${caption.index}\n${startTime} --> ${endTime}\n${caption.text}\n`;
  }).join('\n');
  
  await fs.writeFile(outputPath, srtContent, 'utf8');
  console.log(`📄 SRT file created: ${outputPath}`);
};

// Helper function to convert seconds to SRT time format
const secondsToSRTTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

// Helper function to render video with FFmpeg subtitle burning
const renderVideoWithFFmpeg = (inputPath, srtPath, outputPath, style = 'bottom') => {
  return new Promise((resolve, reject) => {
    // Configure subtitle style based on selected style
    let subtitleFilter;
    
    switch (style) {
      case 'top':
        subtitleFilter = `subtitles=${srtPath}:force_style='Fontname=Noto Sans Devanagari,FontSize=24,PrimaryColour=&Hffffff,BackColour=&H80000000,Bold=1,Alignment=8'`;
        break;
      case 'karaoke':
        subtitleFilter = `subtitles=${srtPath}:force_style='Fontname=Noto Sans Devanagari,FontSize=28,PrimaryColour=&Hff6b6b,SecondaryColour=&H4ecdc4,Bold=1,Alignment=2'`;
        break;
      case 'bottom':
      default:
        subtitleFilter = `subtitles=${srtPath}:force_style='Fontname=Noto Sans Devanagari,FontSize=26,PrimaryColour=&Hffffff,OutlineColour=&H000000,BackColour=&H80000000,Bold=1,Outline=2,Shadow=1,Alignment=2'`;
        break;
    }
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-vf', subtitleFilter,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ]);

    let stderr = '';
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      
      // Log progress
      if (output.includes('time=')) {
        const timeMatch = output.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (timeMatch) {
          console.log(`🎬 Rendering progress: ${timeMatch[1]}`);
        }
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg subtitle rendering completed');
        resolve();
      } else {
        console.error('❌ FFmpeg rendering failed with code:', code);
        console.error('FFmpeg stderr:', stderr);
        reject(new Error(`FFmpeg rendering failed with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      console.error('FFmpeg process error:', error);
      reject(new Error(`Failed to start FFmpeg: ${error.message}`));
    });
  });
};

// Helper function to convert video to Remotion-compatible format
const convertVideoForRemotion = (inputPath) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, 'uploads', `compatible-${Date.now()}.mp4`);
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-c:v', 'libx264',        // Use H.264 codec
      '-preset', 'fast',        // Fast encoding
      '-crf', '23',             // Good quality
      '-c:a', 'aac',            // AAC audio codec
      '-movflags', '+faststart', // Web optimization
      '-pix_fmt', 'yuv420p',    // Compatible pixel format
      '-r', '30',               // 30 fps
      '-y',                     // Overwrite output file
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('FFmpeg conversion:', output);
      // Log progress if available
      if (output.includes('time=')) {
        console.log('Conversion progress:', output.match(/time=[\d:.]+/)?.[0]);
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Video conversion completed successfully');
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg conversion failed with code ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
};

// Helper function to extract audio from video
const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vn', // No video
      '-acodec', 'pcm_s16le',
      '-ar', '16000', // 16kHz sample rate for whisper
      '-ac', '1', // Mono
      '-y', // Overwrite output file
      audioPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', reject);
  });
};

// Helper function to generate captions using whisper.cpp
const generateCaptionsWithWhisper = (audioPath, outputPath) => {
  return new Promise((resolve, reject) => {
    const whisperPath = path.join(__dirname, 'whisper.cpp', 'build', 'bin', 'whisper-cli');
    const modelPath = path.join(__dirname, 'whisper.cpp', 'models', 'ggml-base.bin');

    const whisper = spawn(whisperPath, [
      '-m', modelPath,
      '-f', audioPath,
      '--output-srt',
      '--output-file', outputPath.replace('.srt', '')
    ]);

    let output = '';
    whisper.stdout.on('data', (data) => {
      output += data.toString();
    });

    whisper.stderr.on('data', (data) => {
      console.log('Whisper stderr:', data.toString());
    });

    whisper.on('close', async (code) => {
      if (code === 0) {
        try {
          const srtContent = await fs.readFile(outputPath, 'utf8');
          const captions = parseSRT(srtContent);
          resolve(captions);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`Whisper exited with code ${code}`));
      }
    });

    whisper.on('error', reject);
  });
};

// Helper function to parse SRT content
const parseSRT = (srtContent) => {
  const blocks = srtContent.trim().split('\n\n');
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const index = parseInt(lines[0]);
      const timeRange = lines[1];
      const text = lines.slice(2).join(' ');
      
      const [startTime, endTime] = timeRange.split(' --> ');
      
      return {
        index,
        startTime: srtTimeToSeconds(startTime),
        endTime: srtTimeToSeconds(endTime),
        text: text.trim()
      };
    }
    return null;
  }).filter(Boolean);
};

// Helper function to convert SRT time format to seconds
const srtTimeToSeconds = (timeStr) => {
  const [time, ms] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + (ms ? parseInt(ms) / 1000 : 0);
};

// Open Remotion studio with captions
app.post('/api/open-studio', async (req, res) => {
  try {
    const { videoPath, captions, style } = req.body;
    
    if (!videoPath || !captions) {
      return res.status(400).json({ error: 'Video path and captions are required' });
    }

    // Create a temporary composition with the captions
    const tempCompositionPath = path.join(__dirname, 'src', 'TempCaptionedVideo.jsx');
    // Use full URL path for Remotion to access the video
    const videoUrl = `http://localhost:3000${videoPath.startsWith('/') ? videoPath : `/${videoPath}`}`;
    
    // Calculate video duration from captions
    const lastCaption = captions[captions.length - 1];
    const videoDuration = lastCaption ? Math.ceil(lastCaption.endTime) : 60;
    const durationInFrames = videoDuration * 30; // 30 fps

    // Create temporary composition file
    const compositionContent = `import { CaptionedVideo } from './CaptionedVideo/index.jsx';

export const TempCaptionedVideo = () => {
  return (
    <CaptionedVideo
      videoSrc="${videoUrl}"
      captions={${JSON.stringify(captions, null, 2)}}
      style="${style || 'bottom'}"
    />
  );
};`;

    await fs.writeFile(tempCompositionPath, compositionContent);

    // Update Root.jsx to include the temporary composition
    await updateRootWithTempComposition(durationInFrames, captions, style, videoUrl);

    // Open Remotion studio
    const studioProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      detached: true,
      stdio: 'ignore'
    });

    studioProcess.unref();

    res.json({ 
      success: true, 
      message: 'Remotion studio opening with your captions...',
      studioUrl: 'http://localhost:3001'
    });
  } catch (error) {
    console.error('Studio open error:', error);
    res.status(500).json({ error: 'Failed to open studio: ' + error.message });
  }
});

// Render video with captions using FFmpeg (more reliable than Remotion for problematic videos)
app.post('/api/render-video', async (req, res) => {
  try {
    const { videoPath, captions, style } = req.body;
    
    if (!videoPath || !captions) {
      return res.status(400).json({ error: 'Video path and captions are required' });
    }

    const outputPath = path.join(__dirname, 'outputs', `captioned-${Date.now()}.mp4`);
    const originalVideoPath = path.join(__dirname, videoPath);
    
    // Create SRT file from captions
    const srtPath = path.join(__dirname, 'uploads', `temp-captions-${Date.now()}.srt`);
    await createSRTFile(captions, srtPath);
    
    console.log('🎬 Starting video rendering with FFmpeg...');
    
    try {
      // Use FFmpeg to burn subtitles directly into video (more reliable)
      await renderVideoWithFFmpeg(originalVideoPath, srtPath, outputPath, style);
      console.log('✅ Video rendering completed successfully');
      
      // Clean up temporary SRT file
      await fs.remove(srtPath);
      
      const outputUrl = `/outputs/${path.basename(outputPath)}`;
      res.json({ 
        success: true, 
        outputPath: outputUrl,
        message: 'Video rendered successfully with captions using FFmpeg'
      });
    } catch (ffmpegError) {
      console.warn('FFmpeg rendering failed, trying Remotion fallback:', ffmpegError.message);
      
      // Fallback to Remotion if FFmpeg fails
      try {
        const compatibleVideoPath = await convertVideoForRemotion(originalVideoPath);
        const videoUrl = `http://localhost:3000${compatibleVideoPath.replace(__dirname, '')}`;
        
        const lastCaption = captions[captions.length - 1];
        const videoDuration = lastCaption ? Math.ceil(lastCaption.endTime) : 60;
        const durationInFrames = videoDuration * 30;

        const propsFile = path.join(__dirname, 'temp-props.json');
        const props = {
          videoSrc: videoUrl,
          captions: captions,
          style: style || 'bottom'
        };
        
        await fs.writeFile(propsFile, JSON.stringify(props, null, 2));
        await renderVideoWithRemotion(outputPath, durationInFrames, propsFile);
        
        // Clean up temporary files
        await fs.remove(propsFile);
        await fs.remove(compatibleVideoPath);
        await fs.remove(srtPath);

        const outputUrl = `/outputs/${path.basename(outputPath)}`;
        res.json({ 
          success: true, 
          outputPath: outputUrl,
          message: 'Video rendered successfully with captions using Remotion fallback'
        });
      } catch (remotionError) {
        console.error('Both FFmpeg and Remotion failed:', remotionError.message);
        await fs.remove(srtPath);
        throw new Error(`Video rendering failed: ${ffmpegError.message}. Remotion fallback also failed: ${remotionError.message}`);
      }
    }
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ error: 'Failed to render video: ' + error.message });
  }
});

// Helper function to render video using Remotion
const renderVideoWithRemotion = (outputPath, durationInFrames, propsFile) => {
  return new Promise((resolve, reject) => {
    const remotionRender = spawn('npx', [
      'remotion', 'render',
      'src/index.js',
      'CaptionedVideo',
      outputPath,
      '--props', propsFile,
      '--overwrite',
      '--timeout', '60000',      // 60 second timeout per frame
      '--concurrency', '1',      // Single thread to avoid memory issues
      '--browser-executable', 'chrome' // Use system Chrome if available
    ], {
      cwd: __dirname,
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
    });

    let output = '';
    let errorOutput = '';

    remotionRender.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      
      // Log progress updates
      if (dataStr.includes('Rendered') || dataStr.includes('time remaining')) {
        console.log('Remotion progress:', dataStr.trim());
      }
    });

    remotionRender.stderr.on('data', (data) => {
      const dataStr = data.toString();
      errorOutput += dataStr;
      
      // Only log actual errors, not warnings
      if (dataStr.includes('Error') && !dataStr.includes('Warning')) {
        console.error('Remotion error:', dataStr.trim());
      }
    });

    remotionRender.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Remotion render completed successfully');
        resolve();
      } else {
        console.error('❌ Remotion render failed with code:', code);
        
        // Extract meaningful error message
        const meaningfulError = errorOutput.split('\n')
          .filter(line => line.includes('Error') && !line.includes('Warning'))
          .slice(0, 3)
          .join('\n') || errorOutput;
          
        reject(new Error(`Video rendering failed: ${meaningfulError}`));
      }
    });

    remotionRender.on('error', (error) => {
      console.error('Remotion process error:', error);
      reject(new Error(`Failed to start video rendering: ${error.message}`));
    });
  });
};

// Helper function to update Root.jsx with temporary composition
const updateRootWithTempComposition = async (durationInFrames, captions, style, videoPath) => {
  const rootPath = path.join(__dirname, 'src', 'Root.jsx');
  const rootContent = await fs.readFile(rootPath, 'utf8');
  
  // Check if TempCaptionedVideo import already exists
  if (!rootContent.includes('TempCaptionedVideo')) {
    // Add import
    const updatedContent = rootContent.replace(
      'import { CaptionedVideo } from "./CaptionedVideo/index.jsx";',
      `import { CaptionedVideo } from "./CaptionedVideo/index.jsx";
        import { TempCaptionedVideo } from "./TempCaptionedVideo.jsx";`
    );
    
    // Add composition before the closing tags
    const finalContent = updatedContent.replace(
      '    </>',
      `      <Composition
        id="TempCaptionedVideo"
        component={TempCaptionedVideo}
        durationInFrames={${durationInFrames}}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: "${videoPath}",
          captions: ${JSON.stringify(captions, null, 10)},
          style: "${style || 'bottom'}"
        }}
      />
    </>`
    );
    
    await fs.writeFile(rootPath, finalContent);
  }
};

app.listen(PORT, () => {
  console.log(`🚀 Caption Generator Server running on http://localhost:${PORT}`);
  console.log('📁 Upload videos and generate captions with local Whisper.cpp');
});
