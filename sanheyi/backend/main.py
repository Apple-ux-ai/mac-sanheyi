from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import sys
import httpx

# Add project root to sys.path to allow absolute imports like 'backend.doc_server'
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import json
import importlib
import threading
from config import HOST, PORT, UPLOAD_DIR, DOWNLOAD_DIR
from api.routes import router
from services.ad_proxy import fetch_ads as fetch_remote_ads, DEFAULT_SOFT_NUMBER as AD_DEFAULT_SOFT_NUMBER
import pillow_avif  # 注册AVIF格式支持
from utils.ffmpeg_utils import get_video_info

# 创建临时目录
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

app = FastAPI(title="Image Converter API", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务（用于下载转换后的文件）
app.mount("/downloads", StaticFiles(directory=DOWNLOAD_DIR), name="downloads")

# 注册路由
app.include_router(router, prefix="/api")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}


@app.get("/api/ads")
async def get_ads(position: str, soft_number: str = AD_DEFAULT_SOFT_NUMBER):
    try:
        ads = await fetch_remote_ads(position, soft_number)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Ad service error") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Ad service unreachable: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="Ad service returned invalid JSON") from exc

    return {"ads": ads}


def _simplify_video_info(raw: dict, file_path: str) -> dict:
    name = os.path.basename(file_path) if isinstance(file_path, str) else None

    duration = 0.0
    size = 0
    fmt = (raw or {}).get("format") or {}
    try:
        duration = float(fmt.get("duration") or 0)
    except (TypeError, ValueError):
        duration = 0.0
    try:
        size = int(fmt.get("size") or 0)
    except (TypeError, ValueError):
        size = 0

    streams = (raw or {}).get("streams") or []
    video_stream = next((s for s in streams if (s or {}).get("codec_type") == "video"), None)
    audio_streams = [s for s in streams if (s or {}).get("codec_type") == "audio"]

    width = None
    height = None
    codec = None
    if isinstance(video_stream, dict):
        width = video_stream.get("width")
        height = video_stream.get("height")
        codec = video_stream.get("codec_name")

    audio_codec = None
    if audio_streams:
        audio_codec = (audio_streams[0] or {}).get("codec_name")

    return {
        "name": name,
        "duration": duration,
        "size": size,
        "width": width,
        "height": height,
        "codec": codec,
        "audio_codec": audio_codec,
        "audio_tracks_count": len(audio_streams),
    }


def _extract_path(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict) and isinstance(value.get("path"), str):
        return value["path"]
    return None


def _handle_ipc_action(action: str, payload: dict) -> dict:
    if action == "get-video-info":
        file_path = _extract_path((payload or {}).get("filePath"))
        if not file_path:
            return {"success": False, "error": "Missing filePath"}
        raw = get_video_info(file_path)
        info = _simplify_video_info(raw, file_path)
        return {"success": True, "info": info}

    if action == "generate-preview":
        source_path = _extract_path((payload or {}).get("sourcePath"))
        if not source_path:
            return {"success": False, "error": "Missing sourcePath"}
        output_dir = (payload or {}).get("outputDir") or os.path.join(DOWNLOAD_DIR, "preview")
        from services.preview_service import PreviewService
        return PreviewService.generate_preview(source_path, output_dir)

    if action == "cleanup-preview":
        target_path = (payload or {}).get("path")
        if isinstance(target_path, str) and os.path.exists(target_path):
            try:
                os.remove(target_path)
            except Exception:
                pass
        return {"success": True}

    # Handle DocToolWrapper actions (convert-general, convert-json, convert-xml)
    if action in ["convert-general", "convert-json", "convert-xml"]:
        # Extract parameters
        source_path = _extract_path((payload or {}).get("filePath")) or _extract_path((payload or {}).get("sourcePath"))
        if not source_path:
            return {"success": False, "error": "Missing filePath or sourcePath"}
        
        target_format = (payload or {}).get("targetFormat")
        if not target_format:
             return {"success": False, "error": "Missing targetFormat"}

        output_dir = (payload or {}).get("outputDir")
        
        # Options are everything else in payload
        options = payload.copy()
        options.pop("filePath", None)
        options.pop("sourcePath", None)
        options.pop("targetFormat", None)
        options.pop("outputDir", None)
        
        try:
            # Import ConverterService dynamically to avoid circular imports or early failures
            from backend.doc_server.services.converter_service import ConverterService
            service = ConverterService()
            
            # convert_file logic handles output path generation
            result = service.convert_file(
                input_path=source_path,
                target_format=target_format,
                output_dir=output_dir,
                original_filename=os.path.basename(source_path),
                **options
            )
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    if isinstance(action, str) and action.startswith("convert-"):
        rest = action[len("convert-") :]
        if "-to-" not in rest:
            return {"success": False, "error": f"Unsupported action: {action}"}
        src, tgt = rest.split("-to-", 1)
        module_name = f"{src.replace('-', '_')}_to_{tgt.replace('-', '_')}"
        source_path = _extract_path((payload or {}).get("sourcePath"))
        output_dir = (payload or {}).get("outputDir")
        params = (payload or {}).get("params") or {}

        if not source_path:
            return {"success": False, "error": "Missing sourcePath"}
        if not output_dir:
            return {"success": False, "error": "Missing outputDir"}

        module = importlib.import_module(f"converters.{module_name}")
        class_name = f"{src.upper()}To{tgt.upper()}Converter"
        converter_cls = getattr(module, class_name, None)
        if converter_cls is None:
            converter_cls = next(
                (
                    v
                    for v in vars(module).values()
                    if isinstance(v, type) and v.__name__.endswith("Converter")
                ),
                None,
            )
        if converter_cls is None:
            return {"success": False, "error": f"Converter not found for {action}"}

        converter = converter_cls()
        if isinstance(params, dict):
            return converter.convert(source_path, output_dir, **params)
        return converter.convert(source_path, output_dir)

    return {"success": False, "error": f"Unsupported action: {action}"}


def _ipc_stdin_loop():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except Exception:
            continue

        request_id = request.get("id")
        action = request.get("action")
        payload = request.get("payload") or {}

        try:
            result = _handle_ipc_action(action, payload)
        except Exception as e:
            result = {"success": False, "error": str(e)}

        if request_id:
            try:
                sys.stdout.write(json.dumps({"id": request_id, "result": result}, ensure_ascii=False) + "\n")
                sys.stdout.flush()
            except Exception:
                pass


def _start_http_server():
    try:
        uvicorn.run(app, host=HOST, port=PORT)
    except Exception as e:
        try:
            sys.stderr.write(f"HTTP server failed: {e}\n")
            sys.stderr.flush()
        except Exception:
            pass


if __name__ == "__main__":
    electron_ipc = os.environ.get("ELECTRON_IPC") == "1"
    if electron_ipc:
        try:
            if hasattr(sys.stdin, "reconfigure"):
                sys.stdin.reconfigure(encoding="utf-8")
            if hasattr(sys.stdout, "reconfigure"):
                sys.stdout.reconfigure(encoding="utf-8")
            if hasattr(sys.stderr, "reconfigure"):
                sys.stderr.reconfigure(encoding="utf-8")
        except Exception:
            pass
    if electron_ipc:
        server_thread = threading.Thread(target=_start_http_server, daemon=True)
        server_thread.start()
        _ipc_stdin_loop()
    else:
        t = threading.Thread(target=_ipc_stdin_loop, daemon=True)
        t.start()
        uvicorn.run(app, host=HOST, port=PORT)
