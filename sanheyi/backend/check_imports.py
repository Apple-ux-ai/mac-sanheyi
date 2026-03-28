
from PyInstaller.utils.hooks import collect_submodules
import sys
import os

# Add current directory (backend)
sys.path.insert(0, os.getcwd())
# Add parent directory (repo root)
sys.path.insert(0, os.path.dirname(os.getcwd()))

print("Path:", sys.path)

print("\nCollecting backend.converters:")
try:
    print(collect_submodules('backend.converters'))
except Exception as e:
    print(e)

print("\nCollecting converters:")
try:
    print(collect_submodules('converters'))
except Exception as e:
    print(e)
