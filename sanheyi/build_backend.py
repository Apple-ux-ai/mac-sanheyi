import os
import subprocess
import shutil
import sys

def build_backend():
    print("Building Python backend...")
    
    # Ensure backend directory exists
    backend_dir = os.path.join(os.getcwd(), 'backend')
    if not os.path.exists(backend_dir):
        print("Backend directory not found!")
        sys.exit(1)
        
    # PyInstaller command
    # --onedir: Create a directory with the executable (faster startup than --onefile)
    # --console: Show console (useful for debugging, can be changed to --noconsole later if we want to hide it completely)
    # --name: Name of the executable
    # --clean: Clean cache
    # --distpath: Where to put the output
    # --workpath: Where to put build files
    # --paths: Add backend to python path to find modules
    
    cmd = [
        'pyinstaller',
        '--noconfirm',
        '--onedir',
        '--console',  # Keep console for now to see logs/errors. Electron hides it anyway with child_process
        '--clean',
        '--distpath', os.path.join('backend', 'dist'),
        '--workpath', os.path.join('backend', 'build_temp'),
        '--name', 'api',
        '--paths', 'backend',
        # Add hidden imports if necessary (e.g. if some modules are imported dynamically)
        # '--hidden-import', 'PIL', 
        os.path.join('backend', 'main.py')
    ]
    
    print(f"Running command: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, shell=True)
    
    if result.returncode != 0:
        print("Backend build failed!")
        sys.exit(1)
        
    print("Backend build successful!")
    exe_name = "api.exe" if os.name == "nt" else "api"
    print(f"Executable created at: {os.path.join('backend', 'dist', 'api', exe_name)}")

if __name__ == '__main__':
    build_backend()
