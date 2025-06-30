#!/usr/bin/python3
import sys
import os
print("sys.executable:", sys.executable)
print("\nsys.path:")
for p in sys.path:
    print(p)

# Check if the specific path is there
expected_path = '/usr/local/lib/python3.12/dist-packages'
if expected_path in sys.path:
    print(f"\nSUCCESS: '{expected_path}' is in sys.path.")
else:
    print(f"\nWARNING: '{expected_path}' is NOT in sys.path.")

# Crucially, let's try to import it HERE in this script
print("\nAttempting to import 'SimpleWebSocketServer' directly in check_path.py...")
try:
    import SimpleWebSocketServer
    print("SUCCESS: 'SimpleWebSocketServer' was imported successfully in check_path.py!")
    print("Module location:", SimpleWebSocketServer.__file__) # Show where it was found
except ModuleNotFoundError as e:
    print(f"ERROR: 'SimpleWebSocketServer' still CANNOT be imported in check_path.py. Error: {e}")
except Exception as e:
    print(f"ERROR: An unexpected error occurred during import attempt: {e}")

print("\nAttempting to import 'psutil' directly in check_path.py (as a control)...")
try:
    import psutil
    print("SUCCESS: 'psutil' was imported successfully in check_path.py!")
    print("Module location:", psutil.__file__)
except ModuleNotFoundError as e:
    print(f"ERROR: 'psutil' CANNOT be imported in check_path.py. Error: {e}")
except Exception as e:
    print(f"ERROR: An unexpected error occurred during psutil import attempt: {e}")
