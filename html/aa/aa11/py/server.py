#!/usr/bin/python3
import sys
import os
import datetime
import socket
import threading
import json
import time
import signal

# --- stdout/stderr Redirection (VERY IMPORTANT - MUST BE EARLY) ---
try:
    _initial_base_path_for_redir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    _initial_tmp_dir_for_redir = os.path.join(_initial_base_path_for_redir, "tmp")
    os.makedirs(_initial_tmp_dir_for_redir, exist_ok=True)
    
    devnull_fd = os.open(os.devnull, os.O_RDWR)
    os.dup2(devnull_fd, sys.stdout.fileno())
    os.dup2(devnull_fd, sys.stderr.fileno())
    if devnull_fd > 2: 
        os.close(devnull_fd)
except Exception as e_redir:
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    # This print goes to original stderr if redirection fails (might show in Apache error log)
    print(f"[{timestamp}] CRITICAL_SERVER_PY_ERROR: Failed to redirect stdout/stderr: {e_redir}", file=sys.__stderr__, flush=True)

from simple_websocket_server import WebSocketServer, WebSocket

# --- Configuration ---
BASE_PROJECT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) 
PROJECT_SUBDIR_NAME_FOR_LOGGING = os.path.basename(BASE_PROJECT_PATH) 

TMP_DIR = os.path.join(BASE_PROJECT_PATH, "tmp")
PID_FILE = os.path.join(TMP_DIR, "message_server.pid")
LOCK_FILE = os.path.join(TMP_DIR, "message_server.lock")
ACTIVITY_LOG = os.path.join(TMP_DIR, "message_server_activity.txt")

WEBSOCKET_PORT = 8082
TCP_PORT = 8080
UDP_PORT = 8081
HOST = "0.0.0.0" 

ws_server_instance = None 
keep_running = True 

connected_ws_clients = [] # Our own list to manage client WebSocket handler instances
clients_list_lock = threading.Lock()

# --- Logging ---
def log_activity(message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    full_message = f"[{timestamp}] ({PROJECT_SUBDIR_NAME_FOR_LOGGING}-Server) {message}\n"
    try:
        os.makedirs(TMP_DIR, exist_ok=True) 
        with open(ACTIVITY_LOG, "a") as f:
            f.write(full_message)
    except Exception as e:
        original_stderr = sys.__stderr__ # Failsafe if redirection failed
        print(f"CRITICAL_LOG_ERROR: Error writing to activity log {ACTIVITY_LOG}: {e}", file=original_stderr, flush=True)

# --- WebSocket Handling ---
class ClientConnectionHandler(WebSocket): # Renamed class
    def handleMessage(self):
        log_activity(f"WS: Message from Client {self.address}: {self.data}")
        # Example: if client sends a ping, server could send a pong
        # if self.data == 'ping':
        #     self.sendMessage('pong')

    def handleConnected(self):
        log_activity(f"WS: New Client connected: {self.address}")
        with clients_list_lock:
            connected_ws_clients.append(self) 
        log_activity(f"WS: Total connected clients: {len(connected_ws_clients)}")
        # Send a connection confirmation message to this specific client
        try:
            self.sendMessage(json.dumps({
                "type": "system",
                "event": "connected",
                "message": "Conectado ao servidor WebSocket!",
                "clientId": str(self.address) # Example client identifier
            }))
        except Exception as e:
            log_activity(f"WS: Error sending connection confirmation to {self.address}: {e}")


    def handleClose(self):
        log_activity(f"WS: Client disconnected: {self.address}")
        with clients_list_lock:
            if self in connected_ws_clients:
                connected_ws_clients.remove(self) 
        log_activity(f"WS: Total connected clients: {len(connected_ws_clients)}")

def broadcast_message_to_clients(message_data_dict):
    global connected_ws_clients, clients_list_lock
    message_json = json.dumps(message_data_dict)
    clients_to_notify = []
    with clients_list_lock: 
        clients_to_notify = list(connected_ws_clients)

    if not clients_to_notify:
        log_activity(f"WS_Broadcast: No WebSocket clients to send to. Message: {message_json[:100]}")
        return

    log_activity(f"WS_Broadcast: Broadcasting to {len(clients_to_notify)} client(s): {message_json[:100]}...")
    for client in clients_to_notify:
        try:
            client.sendMessage(message_json)
        except Exception as e:
            log_activity(f"WS_Broadcast: Error sending to WS client {getattr(client, 'address', 'Unknown')}: {e}")

# --- TCP Client Handler & Listener Thread ---
def handle_tcp_client_connection(conn, addr):
    log_activity(f"TCP: Handling connection from {addr[0]}:{addr[1]}")
    with conn:
        while keep_running: 
            try:
                data = conn.recv(1024)
                if not data:
                    log_activity(f"TCP: Connection closed by {addr[0]}:{addr[1]}")
                    break
                if not keep_running: break 
                message_text = data.decode('utf-8', errors='ignore').strip()
                log_activity(f"TCP: Received from {addr[0]}:{addr[1]} - '{message_text}'")
                
                msg_payload = {
                    "type": "tcp", "ip": addr[0], "port": addr[1],
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "data": message_text
                }
                broadcast_message_to_clients(msg_payload)
                conn.sendall(f"TCP Server ACK: '{message_text}' received.".encode('utf-8'))
                if message_text.lower() in ['exit', 'quit']:
                    break
            except ConnectionResetError:
                log_activity(f"TCP: Connection reset by {addr[0]}:{addr[1]}")
                break
            except socket.error as e: 
                log_activity(f"TCP: Socket error with client {addr[0]}:{addr[1]}: {e}")
                break 
            except Exception as e:
                log_activity(f"TCP: Error handling client {addr[0]}:{addr[1]}: {e}")
                break
    log_activity(f"TCP: Handler for {addr[0]}:{addr[1]} finished.")

def tcp_listener_main_loop(): 
    global keep_running
    log_activity(f"TCP: Listener starting on {HOST}:{TCP_PORT}")
    tcp_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    tcp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        tcp_sock.bind((HOST, TCP_PORT))
        tcp_sock.listen(5)
        tcp_sock.settimeout(1.0) 
    except Exception as e:
        log_activity(f"TCP: Bind/listen error: {e}")
        return

    while keep_running: 
        try:
            conn, addr = tcp_sock.accept()
            if not keep_running: 
                conn.close()
                break
            log_activity(f"TCP: Accepted connection from {addr[0]}:{addr[1]}")
            client_conn_thread = threading.Thread(target=handle_tcp_client_connection, args=(conn, addr), daemon=True)
            client_conn_thread.start()
        except socket.timeout: 
            continue 
        except socket.error as e:
             log_activity(f"TCP: Accept error: {e}. Listener loop terminating ({keep_running}).")
             break 
        except Exception as e:
            log_activity(f"TCP: Unexpected error in accept loop: {e}")
            if not keep_running : break 
            time.sleep(0.1) 
    log_activity("TCP: Listener thread loop finished.")
    if tcp_sock: tcp_sock.close()
    log_activity("TCP: Listener socket closed.")

# --- UDP Listener Thread ---
def udp_listener_main_loop(): 
    global keep_running
    log_activity(f"UDP: Listener starting on {HOST}:{UDP_PORT}")
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        udp_sock.bind((HOST, UDP_PORT))
        udp_sock.settimeout(1.0) 
    except Exception as e:
        log_activity(f"UDP: Bind error: {e}")
        return

    while keep_running:
        try:
            data, addr = udp_sock.recvfrom(1024)
            message_text = data.decode('utf-8', errors='ignore').strip()
            log_activity(f"UDP: Received from {addr[0]}:{addr[1]} - '{message_text}'")

            msg_payload = {
                "type": "udp", "ip": addr[0], "port": addr[1],
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "data": message_text
            }
            broadcast_message_to_clients(msg_payload)
            udp_sock.sendto(f"UDP Server ACK: '{message_text}' received.".encode('utf-8'), addr)
        except socket.timeout:
            continue 
        except socket.error as e:
            log_activity(f"UDP: Socket error: {e}. Listener loop terminating ({keep_running}).")
            break
        except Exception as e:
            log_activity(f"UDP: Listener error: {e}")
            if not keep_running: break 
            time.sleep(0.1)
    log_activity("UDP: Listener thread loop finished.")
    if udp_sock: udp_sock.close()
    log_activity("UDP: Listener socket closed.")

# --- Process Management Functions (PID, Lock) ---
def create_lock_file():
    if os.path.exists(LOCK_FILE):
        log_activity(f"LOCK: File {LOCK_FILE} exists.")
        try: 
            with open(LOCK_FILE, 'r') as f: pid_in_lock = int(f.read().strip())
            if os.path.exists(f"/proc/{pid_in_lock}"):
                 log_activity(f"LOCK: Process {pid_in_lock} from lock file is active. Exiting this instance.")
                 return False
            else: 
                log_activity(f"LOCK: Process {pid_in_lock} (stale) from lock file. Removing.")
                os.remove(LOCK_FILE)
        except Exception as e:
            log_activity(f"LOCK: Error checking/removing stale lock '{LOCK_FILE}': {e}. Attempting fresh lock.")
            try: os.remove(LOCK_FILE) 
            except OSError: pass            
    try:
        with open(LOCK_FILE, "w") as f: f.write(str(os.getpid()))
        log_activity(f"LOCK: File {LOCK_FILE} created with PID {os.getpid()}.")
        return True
    except IOError as e:
        log_activity(f"LOCK: Error creating lock file {LOCK_FILE}: {e}")
        return False

def remove_lock_file():
    if os.path.exists(LOCK_FILE):
        try:
            pid_in_lock_str = ""
            with open(LOCK_FILE, 'r') as lf: pid_in_lock_str = lf.read().strip()
            if pid_in_lock_str == str(os.getpid()):
                os.remove(LOCK_FILE)
                log_activity(f"LOCK: File {LOCK_FILE} removed by current PID {os.getpid()}.")
        except Exception as e: 
            log_activity(f"LOCK: Error during lock file removal '{LOCK_FILE}': {e}.")

def write_pid_file():
    try:
        os.makedirs(TMP_DIR, exist_ok=True)
        with open(PID_FILE, "w") as f: f.write(str(os.getpid()))
        log_activity(f"PID: {os.getpid()} written to {PID_FILE}")
    except IOError as e:
        log_activity(f"PID: Unable to write PID file {PID_FILE}: {e}")
        remove_lock_file() 
        sys.exit(1) 

def remove_pid_file():
    if os.path.exists(PID_FILE):
        try: 
            os.remove(PID_FILE)
            log_activity(f"PID: File {PID_FILE} removed.")
        except OSError as e: 
            log_activity(f"PID: Error removing PID file {PID_FILE}: {e}")

# --- Signal Handling for Graceful Shutdown ---
def signal_handler_function(signum, frame):
    global keep_running, ws_server_instance
    signal_name = signal.Signals(signum).name
    log_activity(f"SIGNAL: Received {signal_name}. Initiating shutdown...")
    keep_running = False 
    if ws_server_instance:
        log_activity("SIGNAL: Closing WebSocket server instance...")
        ws_server_instance.close() 

# --- Main Server Logic ---
def main():
    global ws_server_instance, keep_running
        
    log_activity(f"SERVER: Starting up. PID: {os.getpid()}")
    log_activity(f"SERVER: Base Project Path: {BASE_PROJECT_PATH}")
    log_activity(f"SERVER: Temp Dir: {TMP_DIR}")

    if not create_lock_file():
        log_activity("SERVER: Could not acquire lock. Exiting.")
        sys.exit(1) 
    
    write_pid_file() 

    signal.signal(signal.SIGINT, signal_handler_function)
    signal.signal(signal.SIGTERM, signal_handler_function)

    tcp_thread = None
    udp_thread = None

    try:
        ws_server_instance = WebSocketServer(HOST, WEBSOCKET_PORT, ClientConnectionHandler) 
        log_activity(f"WS: Server instance created for ws://{HOST}:{WEBSOCKET_PORT}")

        tcp_thread = threading.Thread(target=tcp_listener_main_loop, daemon=True)
        udp_thread = threading.Thread(target=udp_listener_main_loop, daemon=True)

        tcp_thread.start()
        udp_thread.start()
        log_activity("SERVER: TCP and UDP listener threads started.")

        log_activity("WS: Entering serve_forever loop...")
        ws_server_instance.serve_forever() 

        log_activity("WS: Exited serve_forever loop (server was closed by signal).")

    except SystemExit: 
        log_activity("SERVER: SystemExit caught. Proceeding with cleanup.")
    except KeyboardInterrupt: 
        log_activity("SERVER: KeyboardInterrupt (should be handled by SIGINT).")
    except Exception as e:
        log_activity(f"SERVER: Main loop critical error: {e}")
    finally:
        log_activity("SERVER: Entering finally block for cleanup.")
        keep_running = False 
        
        if tcp_thread and tcp_thread.is_alive():
            log_activity("SERVER: Waiting for TCP thread to finish...")
            tcp_thread.join(timeout=1.5)
        if udp_thread and udp_thread.is_alive():
            log_activity("SERVER: Waiting for UDP thread to finish...")
            udp_thread.join(timeout=1.5)
            
        remove_pid_file()
        remove_lock_file() 
        log_activity("SERVER: Shutdown complete.")

if __name__ == "__main__":
    main()
