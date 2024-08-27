import os
# import nrrd
# import tifffile
# import numpy as np
# import open3d as o3d

from __main__ import app
from flask import request, jsonify

os.makedirs("output", exist_ok=True)

@app.route("/handle_nrrd", methods=["POST"])
def handle_nrrd():
    buffer = request.data
    data_length = len(buffer)

    # # x, y, z
    # data = np.frombuffer(buffer, dtype=np.uint8)
    # data = data.reshape(size, size, size)
    # data = np.where(data == 2, 2, 0).astype(np.uint8)

    # data1 = np.where(data == 2, 255, 0).astype(np.uint8)

    # # z, y, x
    # tifffile.imwrite('../../../../../mask-to-mesh-test/01744_02256_02768/output.tif', data1.transpose(2, 1, 0))
    # nrrd.write('../../../../../mask-to-mesh-test/01744_02256_02768/output.nrrd', data.transpose(2, 1, 0))
    # # tifffile.imwrite('./output/output.tif', data.transpose(2, 1, 0))

    # length
    return jsonify({"status": "success", "data_length": data_length})

