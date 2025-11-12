"""
Routes - FastAPI endpoints for policy chat functionality
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import sys
from pathlib import Path
import json
import asyncio

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from services.chat_service import PolicyChatService
from services.unified_chat_service import UnifiedChatService, AgentType

# Initialize router
router = APIRouter()

# Initialize chat services (singletons)
chat_service = PolicyChatService()  # Legacy policy chat service
unified_chat_service = UnifiedChatService()  # New unified service for all agents


# Request/Response Models
class ChatRequest(BaseModel):
    """Request model for sending a chat message."""
    sessionId: str = Field(..., description="Chat session ID (ULID)")
    message: str = Field(..., min_length=1, max_length=5000, description="User's question")
    enableWebSearch: bool = Field(True, description="Enable research mode with web search (default: True)")


class ChatResponse(BaseModel):
    """Response model for chat messages."""
    response: str = Field(..., description="Assistant's response")
    messageId: str = Field(..., description="Message ID (ULID)")
    timestamp: str = Field(..., description="ISO timestamp")
    metadata: Dict = Field(default_factory=dict, description="Processing metadata (mode, citations, etc.)")


class ChatHistoryItem(BaseModel):
    """Single conversation turn in chat history."""
    messageId: str
    userMessage: str
    assistantResponse: str
    timestamp: str


class ChatHistoryResponse(BaseModel):
    """Response model for chat history."""
    queryId: str
    sessionId: str
    history: List[ChatHistoryItem]


# Endpoints
@router.post("/queries/{query_id}/chat", response_model=ChatResponse)
async def send_chat_message(query_id: str, request: ChatRequest):
    """
    Send a chat message and get an enhanced response with optional web search.

    Args:
        query_id: Policy query ID
        request: Chat request with sessionId, message, and enableWebSearch

    Returns:
        ChatResponse with assistant's answer, messageId, timestamp, and metadata

    Metadata includes:
        - mode: "fast" (document-only) or "research" (with web search)
        - webSearchUsed: boolean
        - citations: List of web citations with URLs
        - documentSources: List of policy documents referenced
        - strategy: Reasoning for mode selection
    """
    try:
        # Run synchronous chat operations in thread pool to avoid blocking event loop
        result = await asyncio.to_thread(
            chat_service.send_message,
            query_id=query_id,
            session_id=request.sessionId,
            user_message=request.message,
            enable_web_search=request.enableWebSearch
        )

        # Check if there was an error
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])

        return ChatResponse(
            response=result["response"],
            messageId=result["messageId"],
            timestamp=result["timestamp"],
            metadata=result.get("metadata", {})
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in send_chat_message: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.get("/queries/{query_id}/chat/{session_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(query_id: str, session_id: str, limit: int = 50):
    """
    Retrieve chat history for a session.

    Args:
        query_id: Policy query ID
        session_id: Chat session ID
        limit: Maximum number of conversation turns to retrieve (default: 50)

    Returns:
        ChatHistoryResponse with list of conversation turns
    """
    try:
        # Run synchronous database operations in thread pool
        history = await asyncio.to_thread(
            chat_service.get_chat_history,
            query_id=query_id,
            session_id=session_id,
            limit=limit
        )

        return ChatHistoryResponse(
            queryId=query_id,
            sessionId=session_id,
            history=[
                ChatHistoryItem(
                    messageId=turn["messageId"],
                    userMessage=turn["userMessage"],
                    assistantResponse=turn["assistantResponse"],
                    timestamp=turn["timestamp"]
                )
                for turn in history
            ]
        )

    except Exception as e:
        print(f"❌ Error in get_chat_history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat history: {str(e)}"
        )


@router.post("/queries/{query_id}/chat/stream")
async def send_chat_message_stream(query_id: str, request: ChatRequest):
    """
    Send a chat message and stream the response word-by-word.

    Args:
        query_id: Policy query ID
        request: Chat request with sessionId and message

    Returns:
        Streaming response with chunks of text
    """
    async def generate():
        try:
            # Run synchronous chat operations in thread pool
            result = await asyncio.to_thread(
                chat_service.send_message,
                query_id=query_id,
                session_id=request.sessionId,
                user_message=request.message
            )

            if "error" in result:
                yield f"data: {json.dumps({'error': result['error']})}\n\n"
                return

            # Stream the response word by word
            response_text = result["response"]
            words = response_text.split()

            for i, word in enumerate(words):
                chunk_data = {
                    "chunk": word + (" " if i < len(words) - 1 else ""),
                    "done": False
                }
                yield f"data: {json.dumps(chunk_data)}\n\n"
                await asyncio.sleep(0.02)  # 20ms delay between words

            # Send final message with metadata
            final_data = {
                "chunk": "",
                "done": True,
                "messageId": result["messageId"],
                "timestamp": result["timestamp"]
            }
            yield f"data: {json.dumps(final_data)}\n\n"

        except Exception as e:
            error_data = {"error": str(e), "done": True}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/queries/{query_id}/chat/health")
async def check_chat_availability(query_id: str):
    """
    Check if chat is available for a policy query.
    Verifies that policy documents exist.

    Args:
        query_id: Policy query ID

    Returns:
        Dict with availability status and document count
    """
    try:
        # Run synchronous document fetch in thread pool
        documents = await asyncio.to_thread(
            chat_service._fetch_policy_documents,
            query_id
        )

        if documents:
            return {
                "available": True,
                "documentsFound": len(documents),
                "message": "Chat is available for this policy"
            }
        else:
            return {
                "available": False,
                "documentsFound": 0,
                "message": "Policy documents not found. Please ensure the policy analysis has completed."
            }

    except Exception as e:
        print(f"❌ Error in check_chat_availability: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check chat availability: {str(e)}"
        )


# ============================================================================
# UNIFIED CHAT ROUTES - System Compass, DSM, Impact Analysis
# ============================================================================

def create_unified_chat_endpoint(agent_type: AgentType, base_path: str):
    """Helper function to create chat endpoints for a specific agent type."""

    @router.post(f"/{base_path}/{{query_id}}/chat", response_model=ChatResponse)
    async def send_unified_chat_message(query_id: str, request: ChatRequest):
        """Send a chat message to the unified agent."""
        try:
            # Run synchronous chat operations in thread pool to avoid blocking event loop
            result = await asyncio.to_thread(
                unified_chat_service.send_message,
                query_id=query_id,
                session_id=request.sessionId,
                user_message=request.message,
                agent_type=agent_type,
                enable_web_search=request.enableWebSearch
            )

            if "error" in result:
                raise HTTPException(status_code=404, detail=result["error"])

            return ChatResponse(
                response=result["response"],
                messageId=result["messageId"],
                timestamp=result["timestamp"],
                metadata=result.get("metadata", {})
            )

        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error in {base_path} send_chat_message: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process {base_path} chat message: {str(e)}"
            )

    @router.get(f"/{base_path}/{{query_id}}/chat/{{session_id}}/history", response_model=ChatHistoryResponse)
    async def get_unified_chat_history(query_id: str, session_id: str, limit: int = 50):
        """Retrieve chat history for the unified agent session."""
        try:
            # Run synchronous database operations in thread pool
            history = await asyncio.to_thread(
                unified_chat_service.get_chat_history,
                query_id=query_id,
                session_id=session_id,
                agent_type=agent_type,
                limit=limit
            )

            return ChatHistoryResponse(
                queryId=query_id,
                sessionId=session_id,
                history=[
                    ChatHistoryItem(
                        messageId=turn["messageId"],
                        userMessage=turn["userMessage"],
                        assistantResponse=turn["assistantResponse"],
                        timestamp=turn["timestamp"]
                    )
                    for turn in history
                ]
            )

        except Exception as e:
            print(f"❌ Error in {base_path} get_chat_history: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to retrieve {base_path} chat history: {str(e)}"
            )

    @router.post(f"/{base_path}/{{query_id}}/chat/stream")
    async def send_unified_chat_message_stream(query_id: str, request: ChatRequest):
        """Send a chat message and stream the response."""
        async def generate():
            try:
                # Run synchronous chat operations in thread pool
                result = await asyncio.to_thread(
                    unified_chat_service.send_message,
                    query_id=query_id,
                    session_id=request.sessionId,
                    user_message=request.message,
                    agent_type=agent_type,
                    enable_web_search=request.enableWebSearch
                )

                if "error" in result:
                    yield f"data: {json.dumps({'error': result['error']})}\n\n"
                    return

                # Stream the response word by word
                response_text = result["response"]
                words = response_text.split()

                for i, word in enumerate(words):
                    chunk_data = {
                        "chunk": word + (" " if i < len(words) - 1 else ""),
                        "done": False
                    }
                    yield f"data: {json.dumps(chunk_data)}\n\n"
                    await asyncio.sleep(0.02)  # 20ms delay between words

                # Send final message with metadata
                final_data = {
                    "chunk": "",
                    "done": True,
                    "messageId": result["messageId"],
                    "timestamp": result["timestamp"]
                }
                yield f"data: {json.dumps(final_data)}\n\n"

            except Exception as e:
                error_data = {"error": str(e), "done": True}
                yield f"data: {json.dumps(error_data)}\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )

    @router.get(f"/{base_path}/{{query_id}}/chat/health")
    async def check_unified_chat_availability(query_id: str):
        """Check if chat is available for this agent type."""
        try:
            # Run synchronous document fetch in thread pool
            documents = await asyncio.to_thread(
                unified_chat_service._fetch_documents,
                query_id,
                agent_type
            )

            if documents:
                return {
                    "available": True,
                    "documentsFound": len(documents),
                    "message": f"Chat is available for this {agent_type.value} analysis"
                }
            else:
                return {
                    "available": False,
                    "documentsFound": 0,
                    "message": f"{agent_type.value} outputs not found. Please ensure the analysis has completed."
                }

        except Exception as e:
            print(f"❌ Error in {base_path} check_chat_availability: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to check {base_path} chat availability: {str(e)}"
            )


# Create endpoints for each agent type
create_unified_chat_endpoint(AgentType.SYSTEM_COMPASS, "system-compass")
create_unified_chat_endpoint(AgentType.DSM, "dsm")
create_unified_chat_endpoint(AgentType.IMPACT_ANALYSIS, "impact-analysis")
