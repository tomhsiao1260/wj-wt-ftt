from __main__ import app

from flask import request, jsonify


@app.route("/handle_nrrd", methods=["POST"])
def handle_nrrd():
    # Ensure that the request content type is what you expect
    # if request.content_type != "application/octet-stream":
    #     return jsonify({"error": "Unsupported Media Type"}), 415

    # Get the binary data from the request
    binary_data = request.data


    # Example processing: return the length of the data
    data_length = len(binary_data)

    return jsonify({"status": "success", "data_length": data_length})


# data = (768, 768, 768)
# data 是一個 (768, 768, 768) 的 numpy
# nrrd.write("mask.nrrd", data)
