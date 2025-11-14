"""
Centralized OpenAI Client Manager
Handles all OpenAI API interactions with async polling support
"""

import openai
import os
from typing import Optional, Any, Dict, List
import time

from config.app_config import PolicyDrafterConfig

POLL_INTERVAL = 10
MAX_WAIT_TIME = 3600
QUEUE_TIMEOUT = 120
MAX_RETRIES = 3

class OpenAIClientManager:
    """
    Centralized OpenAI client with async polling support.
    Supports Chat Completions API and Responses API with background processing.
    """

    def __init__(self, timeout_config: Optional[Dict[str, float]] = None):
        self.config = PolicyDrafterConfig()

        # Set API key
        openai.api_key = self.config.OPENAI_API_KEY
        self.client = openai.OpenAI(
            api_key=self.config.OPENAI_API_KEY
        )

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        max_completion_tokens: Optional[int] = None,
        **kwargs
    ) -> Any:
        """Synchronous chat completion request."""
        params = {
            "model": model,
            "messages": messages,
            **kwargs
        }

        if max_completion_tokens is not None:
            params["max_completion_tokens"] = max_completion_tokens

        response = self.client.chat.completions.create(**params)
        return response

    def responses_create_streaming(
        self,
        model: str,
        input_messages: List[Dict],
        reasoning: Optional[Dict] = None,
        **kwargs
    ) -> str:
        """
        Streaming Responses API request with SAME parameters as background mode.
        Accumulates events and returns complete text (same interface as responses_create_and_wait).

        Uses Responses API with stream=True instead of background=True.
        """
        params = {
            "model": model,
            "input": input_messages,
            "stream": True,  # Use streaming instead of background
            "store": True,
            **kwargs
        }

        if reasoning is not None:
            params["reasoning"] = reasoning
            effort = reasoning.get("effort", "medium")
            print(f"🧠 Using reasoning effort: {effort}")

        print(f"🌊 Starting Responses API streaming...")

        stream = self.client.responses.create(**params)

        accumulated_content = ""
        event_count = 0

        for event in stream:
            event_count += 1

            # Handle text delta events
            if hasattr(event, 'type') and event.type == 'response.output_text.delta':
                if hasattr(event, 'delta') and event.delta:
                    accumulated_content += event.delta

            # Alternative event structure (check data attribute)
            elif hasattr(event, 'data'):
                data = event.data
                if hasattr(data, 'delta') and data.delta:
                    accumulated_content += data.delta

            # Progress indicator every 50 events
            if event_count % 50 == 0:
                print(f"📝 Received {event_count} events...")

        print(f"✅ Streaming completed: {len(accumulated_content)} characters")
        return accumulated_content

    def responses_create(
        self,
        model: str,
        input_messages: List[Dict],
        reasoning: Optional[Dict] = None,
        **kwargs
    ) -> Any:
        """
        Create an async response request.
        Returns response object with 'id' field for polling.
        """
        params = {
            "model": model,
            "input": input_messages,
            **kwargs
        }

        if reasoning is not None:
            params["reasoning"] = reasoning

        params["background"] = True
        params["store"] = True

        response = self.client.responses.create(**params)

        return response

    def get_response(self, response_id: str) -> Any:
        response = self.client.responses.retrieve(response_id)
        return response

    def responses_create_and_wait(
        self,
        model: str,
        system_message: str,
        user_message: str,
        reasoning: Optional[Dict] = None,
        _attempt: int = MAX_RETRIES,
        **kwargs
    ) -> Any:
        attempt_prefix = f"[Attempt {_attempt}/{MAX_RETRIES}] " if _attempt > 1 else ""
        print(f"{attempt_prefix}Creating async response...")

        input_messages = [
            {"role": "developer", "content": [{"type": "input_text", "text": system_message}]},
            {"role": "user", "content": [{"type": "input_text", "text": user_message}]}
        ]

        response = self.responses_create(
            model=model,
            input_messages=input_messages,
            reasoning=reasoning,
            **kwargs
        )

        response_id = response.id
        print(f"Response created with ID: {response_id}")
        print(f"Polling every {POLL_INTERVAL} seconds...")

        # Poll until completion
        start_time = time.time()
        queued_start_time = None

        while True:
            # Check timeout
            elapsed = time.time() - start_time
            if elapsed > MAX_WAIT_TIME:
                raise TimeoutError(f"Response polling exceeded max wait time of {MAX_WAIT_TIME}s")

            # Get current status
            response = self.get_response(response_id)
            status = response.status

            print(f"Status: {status} (elapsed: {int(elapsed)}s)")

            if status == "completed":
                print(f"Response completed!")
                return self.extract_text_from_response(response)
            elif status == "failed":
                error_msg = getattr(response, 'error', 'Unknown error')
                raise Exception(f"Response failed: {error_msg}")
            elif status in ["cancelled", "expired"]:
                raise Exception(f"Response {status}")
            elif status == "queued":
                # Track queue time
                if queued_start_time is None:
                    queued_start_time = time.time()

                queued_elapsed = time.time() - queued_start_time
                if queued_elapsed > QUEUE_TIMEOUT:
                    if _attempt < MAX_RETRIES:
                        print(f"Response queued for {int(queued_elapsed)}s, retrying...")
                        return self.responses_create_and_wait(
                            model=model,
                            system_message=system_message,
                            user_message=user_message,
                            reasoning=reasoning,
                            _attempt=_attempt + 1,
                            **kwargs
                        )
                    else:
                        # Fallback to streaming with SAME model and params
                        print(f"⚠️ Background mode stuck after {MAX_RETRIES} attempts, switching to streaming...")
                        return self._fallback_to_streaming(
                            model=model,
                            system_message=system_message,
                            user_message=user_message,
                            reasoning=reasoning,
                            **kwargs
                        )
            else:
                # Reset queue timer if status changes from queued to something else
                queued_start_time = None

            # Wait before next poll
            time.sleep(POLL_INTERVAL)

    def _fallback_to_streaming(
        self,
        model: str,
        system_message: str,
        user_message: str,
        reasoning: Optional[Dict] = None,
        **kwargs
    ) -> str:
        """
        Fallback to Responses API streaming when background mode fails.
        Uses EXACT same model, API (Responses API), and parameters as responses_create_and_wait.
        """
        # Use same input_messages format as responses_create
        input_messages = [
            {"role": "developer", "content": [{"type": "input_text", "text": system_message}]},
            {"role": "user", "content": [{"type": "input_text", "text": user_message}]}
        ]

        # Call Responses API streaming with same model and params
        return self.responses_create_streaming(
            model=model,
            input_messages=input_messages,
            reasoning=reasoning,
            **kwargs
        )

    def extract_text_from_response(self, response: Any) -> Optional[str]:
        """Extract final text from Responses API response."""
        try:
            if not response or not getattr(response, 'output', None):
                return None
            final_output = response.output[-1]
            if hasattr(final_output, 'content') and final_output.content:
                content0 = final_output.content[0]
                if hasattr(content0, 'text'):
                    return content0.text
            return None
        except Exception:
            return None
        

# Create a singleton instance for easy import
_default_client = None

def get_openai_client(timeout_config: Optional[Dict[str, float]] = None) -> OpenAIClientManager:
    """Get or create the default OpenAI client instance."""
    global _default_client
    if _default_client is None or timeout_config is not None:
        _default_client = OpenAIClientManager(timeout_config)
    return _default_client
