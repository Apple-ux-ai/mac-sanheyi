# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules
import sys
import os

# Add paths to sys.path to allow finding modules
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('..'))

# Collect all submodules from the backend packages to ensure dynamic imports work
# We collect 'converters' as a top-level package because main.py imports it that way
# We also collect 'backend.converters' just in case
# We collect 'backend.doc_server' and 'backend.img_server' as they are imported fully qualified
hidden_imports = (
    collect_submodules('converters') +
    collect_submodules('backend.converters') +
    collect_submodules('backend.doc_server') +
    collect_submodules('backend.img_server') +
    ['uvicorn', 'fastapi', 'pillow_avif', 'engineio.async_drivers.threading']
)

a = Analysis(
    ['main.py'],
    pathex=['.', '..'],
    binaries=[],
    datas=[('bin', 'bin')],
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='api',
)
