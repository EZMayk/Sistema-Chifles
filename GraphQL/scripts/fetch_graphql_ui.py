import httpx

url = 'http://127.0.0.1:8000/graphql'
try:
    r = httpx.get(url, timeout=5)
    print('status', r.status_code)
    print('content-type:', r.headers.get('content-type'))
    print(r.text[:1000])
except Exception as e:
    print('error', e)
