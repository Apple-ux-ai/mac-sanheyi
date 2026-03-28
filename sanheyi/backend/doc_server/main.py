# backend/main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.api.routes import router
from backend.services.converter_service import DOWNLOAD_DIR

app = FastAPI(title="Format Converter API")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境下允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录以供下载
app.mount("/downloads", StaticFiles(directory=DOWNLOAD_DIR), name="downloads")

# 注册路由
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    for route in app.routes:
        if hasattr(route, "methods"):
            print(f"Route: {route.path} {route.methods}")
        else:
            print(f"Route: {route.path} (Mount)")
    is_frozen = getattr(sys, "frozen", False)
    port = int(os.environ.get("BACKEND_PORT", "8002"))
    if is_frozen:
        uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
    else:
        uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
