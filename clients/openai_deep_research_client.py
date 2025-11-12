import openai
import httpx
import threading
import time
import uuid
from typing import Dict, Optional, Any
from enum import Enum

class ResearchStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    FAILED = "failed"

class ResearchTask:
    def __init__(self, task_id: str, query: str, system_message: str = None):
        self.task_id = task_id
        self.query = query
        self.system_message = system_message
        self.status = ResearchStatus.PENDING
        self.result = None
        self.error = None
        self.created_at = time.time()
        self.completed_at = None
        self.progress_messages = []

class OpenAIDeepResearchClient:
    def __init__(self, api_key=None):
        from config.app_config import PolicyDrafterConfig
        self.config = PolicyDrafterConfig()

        self.client = openai.OpenAI(
            api_key=self.config.OPENAI_API_KEY,
            max_retries=1, 
        )
        self.DEFAULT_MODEL = "o3-deep-research"

        # Task storage for async operations
        self._tasks: Dict[str, ResearchTask] = {}
        self._task_lock = threading.Lock()
    
    def make_request(self, user_query, system_message=None, model=None, enable_reasoning=True, timeout_minutes=180):
        """Make a deep research request using background mode with polling."""
        try:
            selected_model = self.DEFAULT_MODEL if not model else model

            input_messages = []

            if system_message:
                input_messages.append({
                    "role": "developer",
                    "content": [{"type": "input_text", "text": system_message}]
                })

            input_messages.append({
                "role": "user",
                "content": [{"type": "input_text", "text": user_query}]
            })

            request_params = {
                "model": selected_model,
                "input": input_messages,
                "tools": [
                    {"type": "web_search_preview"},
                    {"type": "code_interpreter", "container": {"type": "auto", "file_ids": []}}
                ],
                "background": True,  
            }

            if enable_reasoning:
                request_params["reasoning"] = {"summary": "auto"}

            print(f"🔍 Starting deep research request with background mode...")
            print(f"✅ BACKGROUND MODE ENABLED - Using polling strategy (v3.0)")
            print(f"📊 Request params: model={selected_model}, background=True, max_output_tokens=120k, poll_interval=10s")
            print(f"⏱️  Max wait time: {timeout_minutes} minutes...")

            # Create the request (returns immediately with background=True)
            response = self.client.responses.create(**request_params)
            print(f"🎯 Request submitted successfully! Response ID: {response.id[:16]}...")

            # Poll for completion
            response = self._poll_for_completion(response.id, timeout_minutes)

            print("✅ Deep research request completed successfully!")
            return response

        except Exception as e:
            print(f"❌ Deep research failed: {e}")
            raise Exception(f"Deep research failed: {e}")

    def _poll_for_completion(self, response_id: str, timeout_minutes: int, poll_interval: int = 10):
        """Poll for response completion using background mode."""
        import time

        start_time = time.time()
        max_wait_seconds = timeout_minutes * 60
        poll_count = 0

        print(f"📡 POLLING STARTED - Azure-safe background mode (v3.0)")
        print(f"🆔 Response ID: {response_id[:16]}...")
        print(f"⏱️  Poll interval: {poll_interval}s | Max wait: {timeout_minutes}min")

        while True:
            elapsed = time.time() - start_time

            if elapsed > max_wait_seconds:
                raise Exception(f"Deep research timed out after {timeout_minutes} minutes")

            # Retrieve current status
            try:
                response = self.client.responses.retrieve(response_id)
                poll_count += 1

                status = response.status if hasattr(response, 'status') else 'unknown'

                # Log progress every 30 seconds (every 3rd poll at 10s interval)
                if poll_count % 3 == 0:
                    elapsed_mins = int(elapsed / 60)
                    print(f"   📊 [v3.0 POLLING] Status: {status} | Elapsed: {elapsed_mins}m | Polls: {poll_count}")

                # Check if completed
                if status == 'completed':
                    print(f"✅ Research completed after {int(elapsed)} seconds ({poll_count} polls)")
                    return response
                elif status == 'failed':
                    error_msg = getattr(response, 'error', 'Unknown error')
                    raise Exception(f"Deep research failed: {error_msg}")
                elif status in ['queued', 'in_progress']:
                    # Continue polling
                    time.sleep(poll_interval)
                else:
                    # Unknown status, wait and try again
                    print(f"⚠️ Unknown status: {status}, continuing to poll...")
                    time.sleep(poll_interval)

            except Exception as e:
                # If retrieve fails, it might be a temporary network issue
                if "not found" in str(e).lower():
                    raise Exception(f"Response {response_id} not found")
                print(f"⚠️ Polling error: {e}, retrying...")
                time.sleep(poll_interval)
    
    def start_async_research(self, user_query: str, system_message: str = None,
                           enable_reasoning: bool = True, timeout_minutes: int = 180) -> str:
        try:
            selected_model = self.DEFAULT_MODEL

            input_messages = []

            if system_message:
                input_messages.append({
                    "role": "developer",
                    "content": [{"type": "input_text", "text": system_message}]
                })

            input_messages.append({
                "role": "user",
                "content": [{"type": "input_text", "text": user_query}]
            })

            request_params = {
                "model": selected_model,
                "input": input_messages,
                "tools": [
                    {"type": "web_search_preview"},
                    {"type": "code_interpreter", "container": {"type": "auto", "file_ids": []}}
                ],
                "background": True,  # Always use background mode for async
                # No max_output_tokens limit - let model use defaults for complete reports
            }

            if enable_reasoning:
                request_params["reasoning"] = {"summary": "auto"}

            print(f"🚀 Starting deep research in background mode...")

            # Create the request in background mode (returns immediately)
            response = self.client.responses.create(**request_params)

            # Store task info for status tracking
            task_id = response.id
            with self._task_lock:
                task = ResearchTask(task_id, user_query, system_message)
                task.status = ResearchStatus.IN_PROGRESS
                self._tasks[task_id] = task

            print(f"✅ Deep research task created (Task ID: {task_id[:8]}...)")
            return task_id

        except Exception as e:
            print(f"❌ Failed to start deep research: {e}")
            raise Exception(f"Failed to start deep research: {e}")
    
    def get_research_status(self, task_id: str) -> Dict[str, Any]:
        """Get current status of a research task by polling OpenAI API."""
        try:
            # Retrieve from OpenAI API
            response = self.client.responses.retrieve(task_id)

            status = response.status if hasattr(response, 'status') else 'unknown'

            # Update local task tracking if exists
            with self._task_lock:
                task = self._tasks.get(task_id)
                if task:
                    if status == 'completed':
                        task.status = ResearchStatus.COMPLETED
                        task.completed_at = time.time()
                        task.result = response
                    elif status == 'failed':
                        task.status = ResearchStatus.FAILED
                        error_msg = getattr(response, 'error', 'Unknown error')
                        task.error = str(error_msg)
                        task.completed_at = time.time()
                    elif status in ['queued', 'in_progress']:
                        task.status = ResearchStatus.IN_PROGRESS

                    return {
                        "task_id": task_id,
                        "status": status,
                        "created_at": task.created_at,
                        "completed_at": task.completed_at,
                        "progress_messages": task.progress_messages.copy(),
                        "elapsed_seconds": int(time.time() - task.created_at),
                        "has_result": task.result is not None,
                        "error": task.error
                    }

            # Task not in local tracking, return basic info
            return {
                "task_id": task_id,
                "status": status,
                "created_at": None,
                "completed_at": None,
                "progress_messages": [],
                "elapsed_seconds": 0,
                "has_result": status == 'completed',
                "error": None
            }

        except Exception as e:
            return {
                "task_id": task_id,
                "status": "error",
                "error": str(e),
                "has_result": False
            }
    
    def get_research_result(self, task_id: str) -> Optional[Any]:
        """Get the completed research result by retrieving from OpenAI API."""
        try:
            # First check status
            status_info = self.get_research_status(task_id)

            if status_info['status'] == 'completed':
                # Retrieve the complete response
                response = self.client.responses.retrieve(task_id)

                # Check if the response is actually incomplete despite completed status
                if hasattr(response, 'status') and response.status == 'incomplete':
                    print(f"⚠️  WARNING: Research task {task_id[:8]}... marked as completed but response is INCOMPLETE")
                    reason = 'unknown'
                    if hasattr(response, 'incomplete_details') and response.incomplete_details:
                        reason = getattr(response.incomplete_details, 'reason', 'unknown')
                        print(f"⚠️  Incomplete reason: {reason}")

                # Update local cache
                with self._task_lock:
                    task = self._tasks.get(task_id)
                    if task:
                        task.result = response
                        task.status = ResearchStatus.COMPLETED

                return response

            elif status_info['status'] == 'failed':
                error_msg = status_info.get('error', 'Unknown error')
                raise Exception(f"Research failed: {error_msg}")

            else:
                # Still in progress or queued
                return None

        except Exception as e:
            if "not found" in str(e).lower():
                return None
            raise
    
    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """Clean up tasks older than max_age_hours."""
        current_time = time.time()
        cutoff_time = current_time - (max_age_hours * 3600)
        
        with self._task_lock:
            old_tasks = [
                task_id for task_id, task in self._tasks.items()
                if task.created_at < cutoff_time
            ]
            
            for task_id in old_tasks:
                del self._tasks[task_id]
        
        if old_tasks:
            print(f"🧹 Cleaned up {len(old_tasks)} old research tasks")
    
    
    def get_final_report(self, response):
        if not response or not response.output:
            return None

        # Check if response is incomplete (truncated)
        if hasattr(response, 'status') and response.status == 'incomplete':
            reason = 'unknown'
            if hasattr(response, 'incomplete_details') and response.incomplete_details:
                reason = getattr(response.incomplete_details, 'reason', 'unknown')
            print(f"⚠️  WARNING: Deep research response is INCOMPLETE!")
            print(f"⚠️  Reason: {reason}")
            if reason == 'max_output_tokens':
                print(f"⚠️  Output was truncated due to token limit. Report and citations may be partial.")
            print(f"⚠️  Returning partial content - results may be missing data.")

        final_output = response.output[-1]

        if hasattr(final_output, 'content') and final_output.content:
            return final_output.content[0].text

        return None
    
    def get_citations(self, response):
        if not response or not response.output:
            return []

        # Check if response is incomplete (truncated)
        if hasattr(response, 'status') and response.status == 'incomplete':
            reason = 'unknown'
            if hasattr(response, 'incomplete_details') and response.incomplete_details:
                reason = getattr(response.incomplete_details, 'reason', 'unknown')
            if reason == 'max_output_tokens':
                print(f"⚠️  WARNING: Citation list may be incomplete due to output truncation.")

        final_output = response.output[-1]

        if hasattr(final_output, 'content') and final_output.content:
            content = final_output.content[0]
            if hasattr(content, 'annotations'):
                citations = []
                for i, annotation in enumerate(content.annotations):
                    citations.append({
                        'index': i + 1,
                        'title': annotation.title,
                        'url': annotation.url,
                        'start_index': annotation.start_index,
                        'end_index': annotation.end_index
                    })
                return citations

        return []
    
    def get_research_steps(self, response):
        if not response or not response.output:
            return []
            
        steps = []
        for item in response.output:
            step_info = {
                'type': item.type,
                'timestamp': getattr(item, 'timestamp', None)
            }
            
            if item.type == "reasoning":
                step_info['content'] = [s.text for s in item.summary] if hasattr(item, 'summary') else []
            elif item.type == "web_search_call":
                step_info['query'] = item.action.get("query", "") if hasattr(item, 'action') else ""
                step_info['status'] = getattr(item, 'status', None)
            elif item.type == "code_interpreter_call":
                step_info['input'] = getattr(item, 'input', None)
                step_info['output'] = getattr(item, 'output', None)
            
            steps.append(step_info)
        
        return steps
    
    def is_available(self):
        return self.config.OPENAI_API_KEY is not None
    

    
    @classmethod
    def create_safe(cls):
        try:
            return cls()
        except ValueError:
            return None 