#!/usr/bin/env python
import cgi

import cgitb
cgitb.enable()

from BaseHTTPServer import HTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import os
import json
import urllib
from itertools import izip


root = os.path.join(os.getcwd(), "data")

def backup_file(path):
    pass

class MyHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        #global rootnode
        ctype, pdict = cgi.parse_header(self.headers.getheader('content-type'))
        if ctype == 'multipart/form-data': 
            self.query=cgi.parse_multipart(self.rfile, pdict)
            print(urllib.unquote(self.path), self.query)
        #try:
        if self.path.startswith("/put"): self.upload(self.path.split("?"))
        elif self.path.startswith("/ls"): self.resp( self.ls(self.path.split("?")[1]) )
        elif self.path.startswith("/mkdir"): self.resp( self.mkdir(self.path.split("?")[1]) )
        elif self.path.startswith("/get_all_folders"): self.resp( self.get_all_folders() )
        elif self.path.startswith("/get"): self.resp( self.get(self.path.split("?")[1]) )
        else: self.resp('{"error": "Bad Call"}')
        #except:
        #    self.resp('{"error": "Broken Call"}')

    def resp(self, data): self.wfile.write(data)

    def fix_path(self, path):
        global root
        path = urllib.unquote(path)
        if not path.startswith("/"): 
            path = "/" + path
        path = root + path
        if "./" in path: return None
        if "../" in path: return None
        return path

    def upload(self, path):
        #try:
        self.send_response(200)
        self.end_headers()

        a = iter(self.query.get('files'))
        pairs = izip(a, a) 
        for filename, data in pairs:
            path = self.fix_path(filename)
            if os.path.exists(path): backup_file(path)
            open(path, "wb").write(data)

        self.resp('{"status": "ok"}')
        #except :
            #self.resp('{"error": "uplaod failed"}')

    def ls(self, path):
        path = self.fix_path(path)
        if not os.path.exists(path): return '{"func": "ls", "error": "path does not exist", "path": "' + path + '"}'
        if not os.path.isdir(path): return '{"func": "ls", "error": "path is not dir", "path": "' + path + '"}'

        result = {'folders': [], 'files': []}
        for r, b, l in os.walk(path, followlinks=True):
            for d in b:
                result['folders'] += [os.path.join(r, d).replace(root, "")]
            for f in l:
                result['files'] += [os.path.join(r, f).replace(root, "")]
            break

        return json.dumps(result)

    def mkdir(self, path): 
        path = self.fix_path(path)
        if os.path.exists(path): return '{"func": "mkdir", "error": "path exists"}'
        os.makedirs(path)
        return '{"status": "ok"}'

    def get(self, path): 
        path = self.fix_path(path)
        if not os.path.exists(path): return '{"func": "get", "error": "path does not exist"}'
        if os.path.isdir(path): return '{"func": "get", "error": "path is a dir"}'
        
        self.send_response(200)
        
        if path.lower().endswith('.ods'):
            self.send_header ("Content-Type", "application/octet-stream")
            self.send_header ("Content-Disposition", "attachment;filename=%s" % urllib.quote (os.path.basename (path)))
            self.send_header ("Content-Length", os.path.getsize (path))
        
        self.end_headers()

        # Send header with file type

        return open(path).read()

    def get_all_folders(self):
        path = root
        result = { 'folders': [] }
        for r, b, l in os.walk(path, followlinks=True):
            for d in b:
                result['folders'] += [os.path.join(r, d).replace(root, "")]

        return json.dumps(result)



if __name__ == '__main__':
    PORT = 8000
    HOST = ''
    server = HTTPServer((HOST, PORT), MyHandler)
    print 'started httpserver...'
    server.serve_forever()
    server.socket.close()

