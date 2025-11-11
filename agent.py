# agent.py
from dotenv import load_dotenv
import os
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchResults, tool
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage
import requests

load_dotenv()

EXPRESS_API = "http://localhost:3000/api"

@tool
def search_web(query: str):
    """Search the web using DuckDuckGo"""
    search = DuckDuckGoSearchResults(output_format='list')
    return search.run(query)

@tool
def fetch_details(auth_token: str):
    """Fetch the data from pregnancy database to extract personal details about user"""
    if not auth_token:
        return "Error: auth_token is missing."
    resp = requests.get(f"{EXPRESS_API}/auth/pregnancy-profile",
                        headers={"Authorization": auth_token})
    return resp.json()

class MainAgent:
    def __init__(self, context):
        self.llm = ChatGroq(model="openai/gpt-oss-20b", api_key=os.getenv("GROQ_API_KEY"))  # read from environment variable
        self.agent_executor = create_react_agent(self.llm, tools)
        self.dynamic_user_context  = None
        self.context = """
"""
    def run(self, query: str, auth_token: str):
        # The input to the agent is a list of messages.
        # The tool_choice parameter is a list of tool names that the agent can use.
        # The agent will then decide which tool to use based on the query.
        # In this case, we are passing the auth_token to the fetch_details tool.
        
        # Note: The create_react_agent from langgraph expects a list of messages as input.
        # The last message should be the user's query.
        
        # We are also passing the auth_token to the fetch_details tool.
        # The tool_kwargs parameter is a dictionary where the keys are the tool names
        # and the values are dictionaries of the arguments to pass to the tool.
        
        # In this case, we are passing the auth_token to the fetch_details tool.
        
        # The invoke method returns a dictionary with the output of the agent.
        # The messages key contains a list of messages, where the last message
        # is the agent's response.
        
        # We are extracting the content of the last message and returning it.
        
        # The tool_choice parameter is a list of tool names that the agent can use.
        
        # The agent will then decide which tool to use based on the query.
        
        # In this case, we are passing the auth_token to the fetch_details tool.
        
        # The tool_kwargs parameter is a dictionary where the keys are the tool names
        
        # and the values are dictionaries of the arguments to pass to the tool.
        
        # In this case, we are passing the auth_token to the fetch_details tool.
        
        # The invoke method returns a dictionary with the output of the agent.
        
        # The messages key contains a list of messages, where the last message
        
        # is the agent's response.
        
        # We are extracting the content of the last message and returning it.
        
        result = self.agent_executor.invoke(

            {"context": self.context},
            {"messages": [HumanMessage(content=query)]},
            {"recursion_limit": 150},     
        )
        
        return result['messages'][-1].content