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

    # customized header
    header = {
        'type': 'unsigned uint8',
        'dimension': 3,
        'space': 'left-posterior-superior',
        'space directions': [[1.0, 0.0, 0.0],
                            [0.0, 1.0, 0.0],
                            [0.0, 0.0, 1.0]],
        'kinds': ['domain', 'domain', 'domain'],
        'sizes': data.shape,
        'encoding': 'gzip',
        'space origin': [1744, 2256, 2768]
    }

    # _, header = nrrd.read('../../../../../Volumetric_Instance_to_Mesh/data/01744_02256_02768/01744_02256_02768_mask.nrrd')

    # z, y, x
    nrrd.write('../../../../../Volumetric_Instance_to_Mesh/data/01744_02256_02768/output.nrrd', data.transpose(2, 1, 0), header)
    # tifffile.imwrite('./output/output.tif', data.transpose(2, 1, 0))

    # z, y, x
    data = np.where(data == label, 255, 0).astype(np.uint8)
    tifffile.imwrite('../../../../../Volumetric_Instance_to_Mesh/data/01744_02256_02768/output.tif', data.transpose(2, 1, 0))

    # length
    return jsonify({"status": "success", "data_length": data_length})

