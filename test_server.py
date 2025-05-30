#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import threading
import time

PORT = 8000

class HTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    with socketserver.TCPServer(("", PORT), HTTPRequestHandler) as httpd:
        print(f"Server starting at http://localhost:{PORT}")
        print("Ctrl+C to stop the server")
        httpd.serve_forever()

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Wait a moment for server to start
    time.sleep(1)
    
    # Open browser
    webbrowser.open(f'http://localhost:{PORT}')
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer stopped")
