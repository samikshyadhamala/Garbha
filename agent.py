from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchResults, tool
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage
# from langchain.agents import create_agent
import requests
import logging
import os

EXPRESS_API = os.getenv("EXPRESS_API")


logging.basicConfig(level=logging.INFO)


class MainAgent:
    def __init__(self, groq_api_key: str):
        # IMPORTANT: set your model + API key here
        self.llm = ChatGroq(model="openai/gpt-oss-20b", api_key=groq_api_key)

        # bind tool methods as callables
        # Note: create_react_agent expects a list of callables (functions/methods)
        tools = [self.search_web, self.fetch_details]

        # core system prompt (static part)
        self.system_prompt_core = (
            "You are a helpful AI assistant named Dr.Gyno with expertise in medical "
            "and pregnancy knowledge. Answer in simple words a non-medical user can understand. "
            "When user-specific medical context is available, use it to personalize answers. "
            "If the user's condition seems critical, recommend seeing a doctor. "
            "If the query needs up-to-date facts, use the tool `search_web`. "
            "Use tools only when needed. Prefer short numbered points in answers."
        )

        # create the agent executor once (tools are bound methods)
        self.agent_executor = create_react_agent(self.llm, tools, prompt=self.system_prompt_core)

        # dynamic state
        self.dynamic_user_context = None
        self.auth_bearer = None

    # tool must be an instance method with self
    @tool
    def search_web(self, query: str):
        """
        Search the web using DuckDuckGoSearchResults.
        Returns a list/dict result the agent can consume.
        """
        logging.info("search_web called with query: %s", query)
        search = DuckDuckGoSearchResults(output_format="list")
        try:
            return search.run(query)
        except Exception as e:
            logging.exception("search_web failed")
            return {"error": str(e)}

    @tool
    def fetch_details(self, auth_bearer: str = None):
        """
        Fetch user pregnancy profile from EXPRESS_API using the provided bearer token.
        If auth_bearer is omitted, fall back to self.auth_bearer if available.
        """
        print("fetching details....")
        token = auth_bearer or self.auth_bearer
        logging.info("fetch_details called. token present: %s", bool(token))
        if not token:
            return {"error": "Authorization token missing for fetch_details"}

        try:
            resp = requests.get(
                f"{EXPRESS_API}/auth/pregnancy-profile",
                headers={"Authorization": f"Bearer {token}"},
                timeout=8,
            )
            resp.raise_for_status()
            print("this is  details....", resp.json())
            return resp.json()
        except Exception as e:
            logging.exception("fetch_details error")
            return {"error": str(e), "status_code": getattr(e, "response", None)}

    def _build_messages(self, user_query: str):
        """
        Build messages list to pass to the agent. We include:
          - SystemMessage with core prompt
          - SystemMessage with dynamic user context (if any)
          - HumanMessage with the user query
        This ensures the agent always receives the latest dynamic context.
        """
        messages = [SystemMessage(content=self.system_prompt_core)]
        if self.dynamic_user_context:
            # keep this compact and explicit
            messages.append(SystemMessage(content=f"User Context: {self.dynamic_user_context}"))
        messages.append(HumanMessage(content=user_query))
        return messages

    def run(self, query: str):
        """
        Invoke the agent. We pass tool kwargs so fetch_details has the token
        when the tool is called. We also include the latest dynamic_user_context
        via SystemMessage so the LLM sees it.
        """
        logging.info("Agent.run called. dynamic context present: %s", bool(self.dynamic_user_context))
        messages = self._build_messages(query)

        # ensure auth token is present in tool kwargs for fetch_details
        tool_kwargs = {"fetch_details": {"auth_bearer": self.auth_bearer}}

        # invoke the agent executor
        try:
            result = self.agent_executor.invoke(
                {"messages": messages},
                tool_kwargs=tool_kwargs,
                recursion_limit=150,
            )
            # result['messages'] should be present; return last message content
            return result["messages"][-1].content
        except Exception as e:
            logging.exception("Agent invoke failed")
            return f"Error invoking agent: {str(e)}"
