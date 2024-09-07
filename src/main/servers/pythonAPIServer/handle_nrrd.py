import os
import nrrd
import tifffile
import numpy as np
# import open3d as o3d

from __main__ import app
from flask import request, jsonify

os.makedirs("output", exist_ok=True)

@app.route("/handle_nrrd", methods=["POST"])
def handle_nrrd():
    buffer = request.data
    data_length = len(buffer)
    label = 2

    # x, y, z
    data = np.frombuffer(buffer, dtype=np.uint8)
    # data = data.reshape(size, size, size)
    data = data.reshape(256, 256, 256)

    _, header = nrrd.read('../../../../../mask-to-mesh-test/01744_02256_02768/01744_02256_02768_mask.nrrd')

    # z, y, x
    nrrd.write('../../../../../mask-to-mesh-test/01744_02256_02768/output.nrrd', data.transpose(2, 1, 0), header)
    # tifffile.imwrite('./output/output.tif', data.transpose(2, 1, 0))

    # z, y, x
    data = np.where(data == label, 255, 0).astype(np.uint8)
    tifffile.imwrite('../../../../../mask-to-mesh-test/01744_02256_02768/output.tif', data.transpose(2, 1, 0))

    # length
    return jsonify({"status": "success", "data_length": data_length})

