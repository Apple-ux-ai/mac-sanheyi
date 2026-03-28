Windows project transfer bundle for kunqiong-converter

Purpose:
- Move the current project to another Windows machine
- Keep the source code, packaging config, locale files, and required Windows ffmpeg binaries
- Exclude heavy/generated folders that can be rebuilt on the target machine

Included:
- electron/
- frontend/ source files and package files
- backend/ source files
- backend/bin/ Windows ffmpeg binaries
- locales/
- scripts/
- package.json and package-lock.json
- electron-builder.yml
- build_backend.py
- version.txt
- README.md and DELIVER.md

Excluded:
- node_modules/
- frontend/node_modules/
- frontend/dist/
- backend/build/
- backend/build_temp/
- backend/dist/
- __pycache__/
- temporary logs and test outputs

Recommended setup on the other Windows machine:
1. Install Node.js 18+ and Python 3.10+.
2. Extract this archive.
3. Run:
   npm install
   npm install --prefix frontend
   pip install -r backend/requirements.txt pyinstaller
4. Start development:
   npm start
5. Build release:
   npm run build

Notes:
- This bundle is for transferring the project, not for direct installation.
- Because `backend/bin` already contains Windows ffmpeg/ffprobe binaries, the target Windows machine does not need to install ffmpeg separately for this project.
