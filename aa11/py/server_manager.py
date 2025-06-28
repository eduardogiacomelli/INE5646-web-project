#!/usr/bin/python3
import cgi
import json
import os
import subprocess
import sys
import psutil 
import time

# --- Configuration ---
# Assumes this script is in /var/www/html/aa/aa11/py/
CURRENT_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_SCRIPT_PATH = os.path.join(CURRENT_SCRIPT_DIR, "server.py")

PROJECT_ROOT_PATH = os.path.abspath(os.path.join(CURRENT_SCRIPT_DIR, '..')) # Should be /var/www/html/aa/aa11
PROJECT_SUBDIR_NAME_FOR_LOGGING = os.path.basename(PROJECT_ROOT_PATH) # Should be "aa11"

TMP_DIR = os.path.join(PROJECT_ROOT_PATH, "tmp")
PID_FILE = os.path.join(TMP_DIR, "message_server.pid")
LOCK_FILE = os.path.join(TMP_DIR, "message_server.lock")
# ACTIVITY_LOG is managed by server.py; this script might check it.
ACTIVITY_LOG_SERVER = os.path.join(TMP_DIR, "message_server_activity.txt")


PYTHON_EXECUTABLE = sys.executable 

def log_manager_activity(message):
    # This output (stderr) usually goes to Apache's error log for CGI scripts
    print(f"[{PROJECT_SUBDIR_NAME_FOR_LOGGING}-Manager] {message}", file=sys.stderr, flush=True)

def cleanup_stale_files(reason=""):
    log_manager_activity(f"Cleaning up stale files. Reason: {reason}")
    if os.path.exists(PID_FILE):
        try:
            os.remove(PID_FILE)
            log_manager_activity("Stale PID_FILE removed.")
        except OSError as e:
            log_manager_activity(f"Error removing stale PID_FILE: {e}")
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
            log_manager_activity("Stale LOCK_FILE removed.")
        except OSError as e:
            log_manager_activity(f"Error removing stale LOCK_FILE: {e}")


def get_server_status():
    log_manager_activity(f"Checking status. PID file: {PID_FILE}, Lock file: {LOCK_FILE}")
    pid_from_file = None
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, 'r') as f:
                pid_from_file = int(f.read().strip())
            log_manager_activity(f"PID from file: {pid_from_file}")

            if psutil.pid_exists(pid_from_file):
                proc = psutil.Process(pid_from_file)
                cmdline = []
                try: 
                    cmdline = proc.cmdline()
                except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
                    log_manager_activity(f"Process {pid_from_file} (PID file) vanished or access denied during cmdline check: {e}. Assuming stopped.")
                    cleanup_stale_files("Process vanished during cmdline check")
                    return {"status": "stopped"}
                
                is_our_script = False
                if cmdline and PYTHON_EXECUTABLE in cmdline[0]: 
                    if any(SERVER_SCRIPT_PATH == os.path.abspath(arg) for arg in cmdline[1:]):
                        is_our_script = True
                    elif any(SERVER_SCRIPT_PATH in arg for arg in cmdline[1:]): 
                        is_our_script = True
                
                if is_our_script:
                    log_manager_activity(f"Process {pid_from_file} is active and matches server script: {cmdline}")
                    return {"status": "running", "pid": pid_from_file}
                else:
                    log_manager_activity(f"Process {pid_from_file} is active but command line ({cmdline}) doesn't match our server. Stale PID?")
                    if not os.path.exists(LOCK_FILE):
                         cleanup_stale_files("Stale PID, no lock file.")
                    return {"status": "error_stale_pid", "pid": pid_from_file, "message": "Active PID does not appear to be the server process."}
            else: 
                log_manager_activity(f"Process {pid_from_file} from PID file not active. Cleaning stale files.")
                cleanup_stale_files("PID from file not active")
                return {"status": "stopped"}
        except (IOError, ValueError) as e: 
            log_manager_activity(f"Error reading PID file ({type(e).__name__}: {e}). Assuming stopped. Cleaning files.")
            cleanup_stale_files(f"Error reading PID file: {e}")
            return {"status": "stopped"}
        except (psutil.NoSuchProcess, psutil.AccessDenied) as e: 
             log_manager_activity(f"psutil error checking PID {pid_from_file} ({type(e).__name__}: {e}). Assuming stopped. Cleaning files.")
             cleanup_stale_files(f"psutil error: {e}")
             return {"status": "stopped"}

    if os.path.exists(LOCK_FILE):
        log_manager_activity(f"No PID file, but LOCK_FILE {LOCK_FILE} exists. Checking process from lock...")
        try:
            with open(LOCK_FILE, 'r') as lf:
                pid_from_lock = int(lf.read().strip())
            if psutil.pid_exists(pid_from_lock):
                 log_manager_activity(f"Process {pid_from_lock} from lock file is active. Server might be running but PID file missing.")
                 return {"status": "running", "pid": pid_from_lock, "message": "Server running (based on lock file). PID file might be missing."}
            else:
                log_manager_activity(f"Process {pid_from_lock} from lock file not active. Stale lock.")
                cleanup_stale_files("Stale lock file, process not active")
        except (IOError, ValueError, psutil.Error) as e:
            log_manager_activity(f"Error checking lock file process: {e}. Stale lock.")
            cleanup_stale_files(f"Error checking lock file: {e}")

    log_manager_activity("Neither PID file nor active lock indicates a running server. Status: stopped.")
    return {"status": "stopped"}

def start_server():
    log_manager_activity("Attempting to start server...")
    try:
        os.makedirs(TMP_DIR, exist_ok=True)
    except OSError as e:
        log_manager_activity(f"CRITICAL: Could not create TMP_DIR {TMP_DIR}: {e}. Check permissions.")
        return {"status": "error", "message": f"TMP_DIR creation failed: {e}"}

    status_info = get_server_status() 
    if status_info["status"] == "running":
        return {"status": "already_running", "pid": status_info.get("pid"), "message": "Server is already running."}
    
    if os.path.exists(LOCK_FILE):
        log_manager_activity(f"Lock file {LOCK_FILE} still exists before start attempt. This shouldn't happen if status check is robust. Trying to clean.")
        cleanup_stale_files("Pre-start lock file existence")
        status_info = get_server_status()
        if status_info["status"] == "running": 
             return {"status": "already_running", "pid": status_info.get("pid"), "message": "Server was already running (revealed after lock cleanup)."}

    try:
        log_manager_activity(f"Executing: {PYTHON_EXECUTABLE} {SERVER_SCRIPT_PATH}")

        # --- BEGIN PYTHONPATH MODIFICATION ---
        my_env = os.environ.copy() 
        # This is where pip3 installed SimpleWebSocketServer for Python 3.12 on your system
        path_to_local_libs = "/usr/local/lib/python3.12/dist-packages" 

        current_pythonpath = my_env.get("PYTHONPATH", "")
        if path_to_local_libs not in current_pythonpath.split(os.pathsep):
            if current_pythonpath: # if PYTHONPATH already has something
                my_env["PYTHONPATH"] = f"{path_to_local_libs}{os.pathsep}{current_pythonpath}"
            else: # if PYTHONPATH was empty or not set
                my_env["PYTHONPATH"] = path_to_local_libs
        
        log_manager_activity(f"Using PYTHONPATH for Popen: {my_env.get('PYTHONPATH')}")
        # --- END PYTHONPATH MODIFICATION ---

        process = subprocess.Popen(
            [PYTHON_EXECUTABLE, SERVER_SCRIPT_PATH],
            env=my_env, # Pass the modified environment to the subprocess
            start_new_session=True 
        )
        log_manager_activity(f"Popen called. Server.py process group started (Popen PID: {process.pid}). Server should manage its own PID/Lock files now.")
        
        time.sleep(2.5) 
        
        status_after_start = get_server_status()
        if status_after_start["status"] == "running":
             return {"status": "started", "pid": status_after_start.get("pid"), "message": "Server started successfully and reported running."}
        else:
            log_manager_activity(f"Server did NOT start correctly. Post-start status: {status_after_start.get('status', 'unknown')}. Check server activity log: {ACTIVITY_LOG_SERVER}")
            activity_details = ""
            if os.path.exists(ACTIVITY_LOG_SERVER):
                try:
                    with open(ACTIVITY_LOG_SERVER, 'r') as alog:
                        lines = alog.readlines()
                        activity_details = "".join(lines[-5:]) 
                except Exception as log_e:
                    activity_details = f"(Could not read activity log: {log_e})"
            
            log_manager_activity(f"Server failed to start. Details from activity log (if any): {activity_details.strip().replace(chr(10), ' ')}") 
            return {"status": "error_starting", "message": "Server failed to start. Check server_activity_log for details."}

    except Exception as e:
        log_manager_activity(f"Exception during Popen or server start: {e}")
        return {"status": "error_popen", "message": f"Failed to start server process: {str(e)}"}

def stop_server():
    log_manager_activity("Attempting to stop server...")
    pid_to_stop = None

    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, 'r') as f:
                pid_to_stop = int(f.read().strip())
        except (IOError, ValueError) as e:
            log_manager_activity(f"Error reading PID from {PID_FILE}: {e}. Will try lock file.")
            pid_to_stop = None 
    
    if not pid_to_stop and os.path.exists(LOCK_FILE): 
        try:
            with open(LOCK_FILE, 'r') as lf:
                pid_to_stop = int(lf.read().strip())
            log_manager_activity(f"Using PID {pid_to_stop} from LOCK_FILE as PID_FILE was problematic.")
        except (IOError, ValueError) as le:
            log_manager_activity(f"Error reading PID from {LOCK_FILE} too: {le}.")
            cleanup_stale_files("Cannot read PID from either file during stop.")
            return {"status": "error_no_pid_identified", "message": "Cannot identify server PID to stop."}

    if not pid_to_stop: 
        log_manager_activity("No valid PID found. Assuming not running or files corrupt.")
        cleanup_stale_files("No PID found in files during stop.")
        return {"status": "not_running", "message": "Server not running (no valid PID)."}

    log_manager_activity(f"Identified PID {pid_to_stop} for stop attempt.")
    if psutil.pid_exists(pid_to_stop):
        try:
            proc = psutil.Process(pid_to_stop)
            cmdline = []
            try: cmdline = proc.cmdline()
            except psutil.Error: pass 

            is_our_script = False 
            if cmdline and PYTHON_EXECUTABLE in cmdline[0]:
                if any(SERVER_SCRIPT_PATH == os.path.abspath(arg) for arg in cmdline[1:]): is_our_script = True
                elif any(SERVER_SCRIPT_PATH in arg for arg in cmdline[1:]): is_our_script = True
            
            if is_our_script:
                log_manager_activity(f"Sending SIGTERM to process {pid_to_stop} ({SERVER_SCRIPT_PATH})...")
                proc.terminate() 
                try:
                    proc.wait(timeout=5) 
                    log_manager_activity(f"Process {pid_to_stop} terminated gracefully.")
                except psutil.TimeoutExpired:
                    log_manager_activity(f"Process {pid_to_stop} (SIGTERM timeout), sending SIGKILL...")
                    proc.kill() 
                    log_manager_activity(f"Process {pid_to_stop} killed with SIGKILL.")
                
                time.sleep(0.5) 
                cleanup_stale_files("Post-stop command by manager")
                return {"status": "stopped", "message": "Server stop command issued."}
            else:
                log_manager_activity(f"PID {pid_to_stop} is active but not our server cmdline ({cmdline}). Removing our PID file.")
                if os.path.exists(PID_FILE): cleanup_stale_files("Active PID mismatch during stop") 
                return {"status": "error_pid_mismatch_on_stop", "message": "PID active but was not our server."}
        except psutil.NoSuchProcess: 
             log_manager_activity(f"Process {pid_to_stop} not found (already stopped). Cleaning files.")
             cleanup_stale_files("Process not found during stop")
             return {"status": "already_stopped", "message": "Server was already stopped."}
        except (psutil.AccessDenied, Exception) as e:
            log_manager_activity(f"Error sending signal or stopping process {pid_to_stop}: {e}")
            return {"status": "error_stopping_signal", "message": f"Error stopping process: {str(e)}"}
    else: 
        log_manager_activity(f"Process for PID {pid_to_stop} not active. Cleaning stale files.")
        cleanup_stale_files("PID from file not active during stop")
        return {"status": "already_stopped", "message": "Server was not running (PID not active)."}

def main():
    print("Content-Type: application/json")
    print() 

    form = cgi.FieldStorage()
    action = form.getvalue("action")
    response = {}
    
    log_manager_activity(f"Received action: {action}")

    if action == "start":
        response = start_server()
    elif action == "stop":
        response = stop_server()
    elif action == "status":
        response = get_server_status() 
    else:
        response = {"status": "error", "message": "Invalid action specified"}
    
    log_manager_activity(f"Responding with: {json.dumps(response)}")
    print(json.dumps(response))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # This is a last resort if main() itself crashes before printing anything
        # or after printing Content-Type but before full JSON.
        log_manager_activity(f"CRITICAL CGI ERROR in main execution: {type(e).__name__}: {e}")
        # Attempting to send a JSON error response if headers haven't been fully sent.
        # This might itself fail if Content-Type was already printed.
        # The log_manager_activity to stderr is the most reliable trace here.
        #
        # To make this safer, we could buffer output and only print it all at the end
        # or use a more robust CGI error handling mechanism (like cgitb for debugging).
        # For now, we rely on Apache logging stderr.
        #
        # If headers were NOT sent, you could try:
        # print("Content-Type: application/json\n")
        # print(json.dumps({"status": "critical_cgi_error", "message": str(e)}))
        pass
