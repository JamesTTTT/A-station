from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import redis.asyncio as aioredis
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manage WebSocket connections and Redis Pub/Sub subscriptions."""
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_client: aioredis.Redis = None
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}

    async def initialize(self):
        self.redis_client = await aioredis.from_url(
            "redis://redis:6379/2",
            encoding="utf-8",
            decode_responses=True
        )

    async def connect(self, websocket: WebSocket, job_id: str):
        """Accept WebSocket connection and subscribe to job events."""
        await websocket.accept()

        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()

        self.active_connections[job_id].add(websocket)

        # Start redis pub/sub listener

        if job_id not in self.pubsub_tasks:
            task = asyncio.create_task(self._subscribe_to_job(job_id))
            self.pubsub_tasks[job_id] = task

        logger.info(f"Connected to {job_id}")

    async def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)

            if not self.active_connections[job_id]:
                del self.active_connections[job_id]
                if job_id in self.pubsub_tasks:
                    del self.pubsub_tasks[job_id]


    async def _subscribe_to_job(self, job_id: str):
        """
        Subscribe to Redis channel for job events.
        Forward all events to connected WebSockets.
        """
        channel = f"job:{job_id}:events"
        pubsub = self.redis_client.pubsub()

        try:
            await pubsub.subscribe(channel)
            logger.info(f"Subscribed to Redis channel: {channel}")

            async for message in pubsub.listen():
                if message["type"] == "message":
                    event_data = message["data"]

                    # Broadcast to all connected clients for this job
                    await self._broadcast_to_job(job_id, event_data)

        except asyncio.CancelledError:
            logger.info(f"Unsubscribing from {channel}")
            await pubsub.unsubscribe(channel)

        except Exception as e:
            logger.error(f"Error in Redis subscription for {job_id}: {e}")

        finally:
            await pubsub.close()

    async def _broadcast_to_job(self, job_id: str, message: str):
        """Send message to all WebSocket connections for a job."""
        if job_id not in self.active_connections:
            return

        disconnected = set()

        for websocket in self.active_connections[job_id]:
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Failed to send to WebSocket: {e}")
                disconnected.add(websocket)

        for websocket in disconnected:
            self.active_connections[job_id].discard(websocket)


manager = ConnectionManager()