import asyncio
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from GraphQL.app import main as gql_main
from GraphQL.app.clients import RESTClient

query = '{ salesByClient { clientId clientName total } }'

async def main():
    client = RESTClient(gql_main.settings.API_URL)
    try:
        result = await gql_main.schema.execute(query, context_value={ 'rest': client })
        print('errors:', result.errors)
        print('data:', result.data)
    finally:
        await client.close()

if __name__ == '__main__':
    asyncio.run(main())
