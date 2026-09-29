import os
import httpx
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class HindsightClient:
    def __init__(self):
        self.api_url = os.getenv("HINDSIGHT_API_URL", "http://localhost:8888")
        self.api_key = os.getenv("HINDSIGHT_API_KEY", "")
        self.bank_id = os.getenv("HINDSIGHT_BANK_ID", "sentinelai-local")
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

    async def aretain(self, memory: Dict[str, Any]) -> bool:
        """Retain a new memory in Hindsight."""
        try:
            # First attempt to use the official SDK if it's installed (mocked for safety)
            try:
                import hindsight
                client = hindsight.AsyncClient(api_key=self.api_key, base_url=self.api_url)
                await client.aretain(bank_id=self.bank_id, document=memory)
                return True
            except ImportError:
                # Fallback to direct HTTP API
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.api_url}/banks/{self.bank_id}/memories",
                        json=memory,
                        headers=self.headers,
                        timeout=5.0
                    )
                    response.raise_for_status()
                    return True
        except Exception as e:
            logger.error(f"Hindsight aretain failed: {e}")
            return False

    async def arecall(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Recall relevant memories from Hindsight."""
        try:
            try:
                import hindsight
                client = hindsight.AsyncClient(api_key=self.api_key, base_url=self.api_url)
                result = await client.arecall(bank_id=self.bank_id, query=query, limit=limit)
                return result.get('matches', [])
            except ImportError:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.api_url}/banks/{self.bank_id}/recall",
                        json={"query": query, "limit": limit},
                        headers=self.headers,
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        return response.json().get("matches", [])
                    return []
        except Exception as e:
            logger.error(f"Hindsight arecall failed: {e}")
            return []

    async def areflect(self, context: str) -> str:
        """Synthesize multiple memories."""
        try:
            try:
                import hindsight
                client = hindsight.AsyncClient(api_key=self.api_key, base_url=self.api_url)
                result = await client.areflect(bank_id=self.bank_id, context=context)
                return result.get('synthesis', '')
            except ImportError:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.api_url}/banks/{self.bank_id}/reflect",
                        json={"context": context},
                        headers=self.headers,
                        timeout=10.0
                    )
                    if response.status_code == 200:
                        return response.json().get("synthesis", "")
                    return "Synthesis unavailable."
        except Exception as e:
            logger.error(f"Hindsight areflect failed: {e}")
            return "Reflection failed due to an error."

    async def health_check(self) -> str:
        """Check Hindsight connectivity."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/health", timeout=2.0)
                if response.status_code == 200:
                    return "connected"
        except Exception:
            pass
        return "unavailable"

hindsight_client = HindsightClient()
