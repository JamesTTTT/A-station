from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.websockets.manager import manager
from app.api.deps import get_current_user_ws
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/jobs/{job_id}")
async def websocket_job_logs(
    websocket: WebSocket,
    job_id: str,
    # user = Depends(get_current_user_ws)  # TODO: Add auth
):
    """
    WebSocket endpoint for real-time job event streaming.

    Client receives events as they happen:
    - Task start/complete
    - Output lines
    - Errors
    - Final stats
    """
    await manager.connect(websocket, job_id)

    try:
        # Keep connection alive and handle client messages
        while True:
            data = await websocket.receive_text()

            # Handle client commands (e.g., cancel job)
            if data == "cancel":
                # TODO: Publish cancellation to Redis
                pass

    except WebSocketDisconnect:
        await manager.disconnect(websocket, job_id)
        logger.info(f"Client disconnected from job {job_id}")

    except Exception as e:
        logger.error(f"WebSocket error for job {job_id}: {e}")
        await manager.disconnect(websocket, job_id)