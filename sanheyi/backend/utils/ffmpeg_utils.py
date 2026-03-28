import subprocess
import os
import json
import re
import sys

def get_tool_path(tool_name):
    """
    Get the absolute path to the binary tool (ffmpeg/ffprobe).
    Handles dev environment and PyInstaller frozen environment.
    """
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle, the PyInstaller bootloader
        # extends the sys module by a flag frozen=True.
        if hasattr(sys, '_MEIPASS'):
            # Onefile mode
            base_path = sys._MEIPASS
        else:
            # Onedir mode
            base_path = os.path.dirname(sys.executable)
    else:
        # Dev environment: look in backend/bin relative to this file
        # This file is in backend/utils/, so we go up two levels to backend/
        # and then look for bin/
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Check for the tool in the 'bin' directory
    # Append .exe for Windows if not present
    if os.name == 'nt' and not tool_name.endswith('.exe'):
        filename = f"{tool_name}.exe"
    else:
        filename = tool_name

    potential_path = os.path.join(base_path, 'bin', filename)
    
    if os.path.exists(potential_path):
        return potential_path
        
    # Fallback to system PATH if not found in bundled bin
    return tool_name

def run_ffmpeg_command(command, progress_callback=None):
    """
    Execute FFmpeg command and report progress in real-time
    """
    try:
        # Resolve ffmpeg path
        ffmpeg_executable = get_tool_path('ffmpeg')
        
        if command[0] == 'ffmpeg':
            command[0] = ffmpeg_executable
        elif command[0] != ffmpeg_executable:
            command.insert(0, ffmpeg_executable)
            
        startupinfo = None
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, # Merge stderr into stdout
            stdin=subprocess.PIPE,
            startupinfo=startupinfo,
            universal_newlines=True,
            encoding='utf-8',
            errors='replace'
        )
        
        # Regex to match time in FFmpeg output: time=00:00:01.23
        time_pattern = re.compile(r"time=(\d{2}:\d{2}:\d{2}\.\d{2})")
        
        full_output = []
        for line in process.stdout:
            full_output.append(line)
            match = time_pattern.search(line)
            if match and progress_callback:
                time_str = match.group(1)
                # Convert 00:00:01.23 to seconds
                h, m, s = time_str.split(':')
                seconds = int(h) * 3600 + int(m) * 60 + float(s)
                progress_callback(seconds)
        
        process.wait()
        
        if process.returncode != 0:
            return {
                'success': False,
                'error': "".join(full_output[-10:]) # Return last few lines of error
            }
            
        return {
            'success': True,
            'message': 'Conversion completed successfully'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_video_info(file_path):
    """
    Get video info (using ffprobe) with OS-level fallback for file size
    """
    # Get basic file info from OS as fallback
    try:
        file_size = os.path.getsize(file_path)
    except Exception:
        file_size = 0

    try:
        # Resolve ffprobe path
        ffprobe_executable = get_tool_path('ffprobe')
        
        command = [
            ffprobe_executable,
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            file_path
        ]
        
        startupinfo = None
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            
        result = subprocess.run(
            command,
            capture_output=True,
            startupinfo=startupinfo
        )
        
        if result.returncode == 0:
            stdout_str = result.stdout.decode('utf-8', errors='replace')
            info = json.loads(stdout_str)
            
            # Ensure size is populated from OS if ffprobe didn't get it
            if 'format' in info:
                if not info['format'].get('size') or int(info['format'].get('size', 0)) == 0:
                    info['format']['size'] = str(file_size)
            return info
            
        # If ffprobe fails, return basic info from OS
        return {
            'format': {
                'filename': file_path,
                'size': str(file_size),
                'duration': '0'
            },
            'streams': []
        }
    except Exception:
        # Fallback to minimum required structure
        return {
            'format': {
                'filename': file_path,
                'size': str(file_size),
                'duration': '0'
            },
            'streams': []
        }
