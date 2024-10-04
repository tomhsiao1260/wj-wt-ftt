import os
import nrrd
import tifffile
import numpy as np
# import open3d as o3d

from __main__ import app
from flask import request, jsonify

os.makedirs("output", exist_ok=True)

# some params

# label = 1
# size = 256
# grid_coords = (1744, 2256, 2768) # z, y, x

label = 1
size = 768
grid_coords = (10624, 2304, 2432) # z, y, x

@app.route("/handle_nrrd", methods=["POST"])
def handle_nrrd():
    z, y, x = grid_coords
    buffer = request.data
    data_length = len(buffer)

    # x, y, z
    data = np.frombuffer(buffer, dtype=np.uint8)
    data = data.reshape(size, size, size)

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
        'space origin': [z, y, x]
    }
    # _, header = nrrd.read('../../../../../Volumetric_Instance_to_Mesh/data/01744_02256_02768/01744_02256_02768_mask.nrrd')

    # z, y, x
    nrrd.write('./output/output.nrrd', data.transpose(2, 1, 0), header)

    # z, y, x
    data = np.where(data == label, 255, 0).astype(np.uint8)
    tifffile.imwrite('./output/output.tif', data.transpose(2, 1, 0))

    # length
    return jsonify({"status": "success", "data_length": data_length})

