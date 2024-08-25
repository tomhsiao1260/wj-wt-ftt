from __main__ import app

from flask import request, jsonify


@app.route("/handle_nrrd", methods=["POST"])
def handle_nrrd():

    binary_data = request.data
    data_length = len(binary_data)

    # length
    return jsonify({"status": "success", "data_length": data_length})


# data = (768, 768, 768)
# data 是一個 (768, 768, 768) 的 numpy
# nrrd.write("mask.nrrd", data)
