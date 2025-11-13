import json
import httpx

url = 'http://127.0.0.1:8000/graphql'
query = '{ salesByClient { clientId clientName total } }'

async def main():
    async with httpx.AsyncClient(timeout=10.0) as c:
            # Try GET first
            r = await c.get(url, params={'query': query})
            print('GET status', r.status_code)
            try:
                print(json.dumps(r.json(), indent=2, ensure_ascii=False))
            except Exception:
                print('raw GET:', r.text[:1000])

            # Then try POST
            r = await c.post(url, json={'query': query})
            print('POST status', r.status_code)
            try:
                print(json.dumps(r.json(), indent=2, ensure_ascii=False))
            except Exception:
                print('raw POST:', r.text[:1000])

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
