# fetch.py
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import  Main_agents from agent
# import requests

# app = Flask(_name_)
# CORS(app) 

# EXPRESS_API = "http://localhost:3000/api"

# @app.route("/run-agent", methods=["POST"])
# def run_agent():
#     print("1----")
#     auth_header = request.headers.get("Authorization")
#     user_query = request.json.get("query")

#     print({"user_quer":user_query, "auth_header":auth_header})

#     # Return a JSON response
#     obj = Main_agents()
#     obj.agent(user_query)
#     return jsonify({
#         "status": "success",
#         "message": "Data received",
#         "your_query": user_query
#     })


# if _name_ == "_main_":
#     app.run(debug=True, host='0.0.0.0')

from flask import Flask, request, jsonify
from flask_cors import CORS
from agent import MainAgent  # Corrected import
import requests

app = Flask(_name_)
CORS(app)

agent = MainAgent()

@app.route("/run-agent", methods=["POST"])
def run_agent():
    print("1----")
    auth_header = request.headers.get("Authorization")
    user_query = request.json.get("query")
    user_context = request.json.get("context")
    print({"user_query": user_query, "auth_header": auth_header})

    # Call the 'run' method with the query and auth token
    agent.dynamic_user_context = user_context
    result = agent.run(query=user_query, auth_token=auth_header)

    return jsonify({
        "status": "success",
        "message": "Data received",
        "your_query": user_query,
        "agent_result": result
    })

if _name_ == "_main_":
    app.run(debug=True, host="0.0.0.0")