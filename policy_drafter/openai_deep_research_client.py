import openai
import os
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
        from .config import PolicyDrafterConfig
        self.config = PolicyDrafterConfig()
        
        api_key = api_key or self.config.OPENAI_API_KEY
        if not api_key:
            raise ValueError("OpenAI API key is required.")

        # Configure a resilient HTTP client for cloud environments (e.g., Azure)
        # - trust_env=True to respect proxy settings if present
        # - http2=False to avoid intermittent HTTP/2 issues on some networks
        # - explicit timeouts so connect doesn't hang indefinitely
        http_timeout = httpx.Timeout(connect=15.0, read=10800.0, write=120.0, pool=60.0)
        http_client = httpx.Client(timeout=http_timeout, http2=False, trust_env=True)

        self.client = openai.OpenAI(
            api_key=api_key,
            http_client=http_client,
            max_retries=2,
        )
        self.DEFAULT_MODEL = "o3-deep-research"
        
        # Task storage for async operations
        self._tasks: Dict[str, ResearchTask] = {}
        self._task_lock = threading.Lock()
    
    def make_request(self, user_query, system_message=None, model=None, enable_reasoning=True, timeout_minutes=180):
        """Make a deep research request with retry logic and Azure-safe streaming by default."""
        max_retries = 2
        for attempt in range(max_retries):
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
                    ]
                }
                
                if enable_reasoning:
                    request_params["reasoning"] = {"summary": "auto"}
                
                print(f"🔍 Starting deep research (attempt {attempt + 1}/{max_retries})...")
                print(f"⏱️  Timeout set to {timeout_minutes} minutes...")

                # Use streaming to avoid long idle connections being dropped in Azure
                # Streaming keeps the TCP connection active with periodic frames.
                if os.getenv("CONTAINER_APP_NAME"):
                    with self.client.responses.stream(**request_params) as stream:
                        for _event in stream:
                            # We don't need to process intermediate events here; streaming prevents idle timeouts.
                            pass
                        response = stream.get_final_response()
                else:
                    # Local or non-Azure: direct call is fine
                    response = self.client.responses.create(**request_params)
                
                print("✅ Deep research request completed successfully!")
                return response
                
            except Exception as e:
                if "reasoning.summary" in str(e) and enable_reasoning:
                    print("Organization not verified for reasoning summaries. Retrying without reasoning...")
                    return self.make_request(user_query, system_message, model, enable_reasoning=False, timeout_minutes=timeout_minutes)
                
                print(f"❌ Deep research attempt {attempt + 1} failed: {e}")
                
                if attempt < max_retries - 1:
                    print(f"🔄 Retrying in 5 seconds... ({attempt + 2}/{max_retries})")
                    import time
                    time.sleep(5)
                else:
                    print("❌ All deep research attempts failed.")
                    raise Exception(f"Deep research failed after {max_retries} attempts: {e}")
        
        return None
    
    def start_async_research(self, user_query: str, system_message: str = None, 
                           enable_reasoning: bool = True, timeout_minutes: int = 180) -> str:
        """Start deep research in background and return task ID immediately."""
        task_id = str(uuid.uuid4())
        
        with self._task_lock:
            task = ResearchTask(task_id, user_query, system_message)
            self._tasks[task_id] = task
        
        # Start research in background thread
        thread = threading.Thread(
            target=self._execute_research_async,
            args=(task_id, enable_reasoning, timeout_minutes),
            daemon=True
        )
        thread.start()
        
        print(f"🚀 Deep research started async (Task ID: {task_id[:8]}...)")
        return task_id
    
    def get_research_status(self, task_id: str) -> Dict[str, Any]:
        """Get current status of a research task."""
        with self._task_lock:
            task = self._tasks.get(task_id)
            if not task:
                return {"error": "Task not found"}
            
            return {
                "task_id": task_id,
                "status": task.status.value,
                "created_at": task.created_at,
                "completed_at": task.completed_at,
                "progress_messages": task.progress_messages.copy(),
                "elapsed_seconds": int(time.time() - task.created_at),
                "has_result": task.result is not None,
                "error": task.error
            }
    
    def get_research_result(self, task_id: str) -> Optional[Any]:
        """Get the completed research result."""
        with self._task_lock:
            task = self._tasks.get(task_id)
            if not task:
                return None
            
            if task.status == ResearchStatus.COMPLETED:
                return task.result
            elif task.status == ResearchStatus.FAILED:
                raise Exception(f"Research failed: {task.error}")
            else:
                return None  # Still in progress
    
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
    
    def _execute_research_async(self, task_id: str, enable_reasoning: bool, timeout_minutes: int):
        """Execute research in background thread."""
        with self._task_lock:
            task = self._tasks.get(task_id)
            if not task:
                return
            
            task.status = ResearchStatus.IN_PROGRESS
            task.progress_messages.append(f"Started research at {time.strftime('%H:%M:%S')}")
        
        try:
            print(f"🔍 Executing deep research for task {task_id[:8]}...")
            
            # Add progress updates
            with self._task_lock:
                task.progress_messages.append("Preparing OpenAI request...")
            
            # Use full timeout for Azure environment (now supports up to 120 minutes)
            actual_timeout = timeout_minutes  # Allow full timeout duration
            
            result = self.make_request(
                task.query, 
                task.system_message, 
                enable_reasoning=enable_reasoning,
                timeout_minutes=actual_timeout
            )
            
            with self._task_lock:
                task.result = result
                task.status = ResearchStatus.COMPLETED
                task.completed_at = time.time()
                elapsed = int(task.completed_at - task.created_at)
                task.progress_messages.append(f"Research completed in {elapsed} seconds")
                
            print(f"✅ Deep research completed for task {task_id[:8]} ({elapsed}s)")
            
        except Exception as e:
            with self._task_lock:
                task.status = ResearchStatus.FAILED
                task.error = str(e)
                task.completed_at = time.time()
                task.progress_messages.append(f"Research failed: {str(e)}")
                
            print(f"❌ Deep research failed for task {task_id[:8]}: {e}")
    
    def get_final_report(self, response):
        if not response or not response.output:
            return None
            
        final_output = response.output[-1]
        
        if hasattr(final_output, 'content') and final_output.content:
            return final_output.content[0].text
        
        return None
    
    def get_citations(self, response):
        if not response or not response.output:
            return []
            
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