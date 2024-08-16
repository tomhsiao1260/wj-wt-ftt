from flask import Flask

from get_current_user import *

app = Flask(__name__)


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/me")
def me_api():
    user = get_current_user()
    return {
        "username": user["username"],
        "gender": user["gender"],
    }


app.run(host="0.0.0.0", port=8734)
