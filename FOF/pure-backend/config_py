import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Jira configuration
    JIRA_SERVER = os.getenv("JIRA_SERVER", "https://your-jira-domain.com")
    JIRA_USER = os.getenv("JIRA_USER", "your-email@example.com")
    JIRA_TOKEN = os.getenv("JIRA_TOKEN", "your-api-token")  # Use API token instead of password

    # Flask configuration
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    PORT = 8069
