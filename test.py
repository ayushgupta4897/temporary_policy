from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client


openai_manager = get_openai_client()

content = openai_manager.responses_create_and_wait(
    model=PolicyDrafterConfig.GPT_5,
    system_message="You are a helpful assistant.",
    user_message="What is the meaning of life?",
    reasoning={"effort": "high"}
)


print(content)