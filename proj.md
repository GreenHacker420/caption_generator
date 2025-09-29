Full-Stack Internship Task — Remotion Captioning Demo
Goal (simple):
 Build a local web app (no hosting required) that lets a user upload an MP4, automatically generates captions for the audio, and renders those captions onto the video using Remotion. The app must support multiple caption styles and correctly show Hinglish (Hindi + English mixed) captions. Provide the code as a Drive link (or Git repo link + zip) along with clear instructions so the app can be run locally with VS Code.

Mandatory Requirements (must-have)
Remotion integration: Use Remotion (see remotion.dev) to render captions over videos.


Upload MP4: Provide a UI to upload any .mp4 from the local machine.


Auto-captioning: A button “Auto-generate captions” that runs speech-to-text and returns caption text. You may use any STT solution (cloud API or local Whisper). Document which approach you used.


Hinglish support: Captions must render correctly when text contains both Devanagari (Hindi) and Latin (English) characters. Ensure proper font handling (e.g., Noto Sans Devanagari + Noto Sans).


Caption presets (important note):


No timeline implementation is required.


Just provide 2–3 predefined caption styles (presets) (e.g., bottom-centered, top bar, karaoke-style).


User should be able to select a preset from the UI, and captions should appear in that style.


Local preview: Real-time preview of the video with captions (Remotion Player or similar).


Export: Allow exporting the final video as MP4 (or provide clear steps to run Remotion’s local render command).


Deliverables:


Codebase in a Drive link (or GitHub repo + zip).


README.md with exact instructions for running locally in VS Code (Node.js version, setup steps, commands).


At least one sample video and its exported captioned output.



Nice-to-have / Bonus (optional)
Use offline Whisper (whisper.cpp or local model).


Import/export SRT/VTT files.


Word-level karaoke effect (if easy).


Clean modular code, TypeScript, or containerized setup (Docker/devcontainer).



Key Notes for Candidates
Keep it simple: No need to implement advanced timeline editors, drag-drop caption placement, or caption-by-frame logic.


Only 2–3 caption presets are required — just ensure they render cleanly and support Hinglish.


Focus is on: understanding Remotion, integrating speech-to-text, and displaying captions in multiple styles.



