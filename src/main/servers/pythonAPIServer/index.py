from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# routes
import handle_nrrd


app.run(host="0.0.0.0", port=8734)
        