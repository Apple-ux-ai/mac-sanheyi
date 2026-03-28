from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from config import HOST, PORT, UPLOAD_DIR, DOWNLOAD_DIR
from api.routes import router
import pillow_avif  # 注册AVIF格式支持

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

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
