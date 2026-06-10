import urllib.request
import json
req = urllib.request.Request('http://127.0.0.1:8000/api/website/home-page/2/', data=b'steps=%5B%7B%22id%22%3A%201%2C%20%22title%22%3A%20%22Test%22%7D%5D', method='PUT')
req.add_header('Content-Type', 'application/x-www-form-urlencoded')
try:
    urllib.request.urlopen(req)
    print("Success!")
except Exception as e:
    print(e.read().decode())
