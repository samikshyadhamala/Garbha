from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import MainAgent
import os
import logging

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

# Provide your Groq/OpenAI-like API key here (keep secret)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

agent = MainAgent(groq_api_key=GROQ_API_KEY)


@app.route("/run-agent", methods=["POST"])
def run_agent():
    logging.info("Received /run-agent request")
    auth_header = request.headers.get("Authorization", "")
    body = request.get_json(silent=True) or {}
    user_query = body.get("query", "")
    user_context = body.get("context", None)

    # Basic validation
    if not user_query:
        return jsonify({"status": "error", "message": "Missing 'query' in body"}), 400

    # Extract bearer if present
    only_auth = None
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            only_auth = parts[1]
        else:
            # If a different format is used, just try the last piece
            only_auth = parts[-1] if parts else None

    # set agent dynamic state
    agent.dynamic_user_context = user_context
    agent.auth_bearer = only_auth

    logging.info("Invoking agent with query: %s", user_query)
    result = agent.run(query=user_query)

    return jsonify({
        "status": "success",
        "message": "Data received",
        "your_query": user_query,
        "agent_result": result
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
