import os
import nrrd
import gzip
import tifffile
import numpy as np
# from scipy.ndimage import gaussian_filter

from __main__ import app
from flask import request, jsonify

label_values = None # List of label values to process, pass None to process all labels

def parse_nrrd(buffer):
    # header template
    header = {
        'type': 'unsigned uint8',
        'dimension': 3,
        'space': 'left-posterior-superior',
        'space directions': [[1.0, 0.0, 0.0],
                            [0.0, 1.0, 0.0],
                            [0.0, 0.0, 1.0]],
        'kinds': ['domain', 'domain', 'domain'],
        'sizes': [256, 256, 256],
        'encoding': 'gzip',
        'space origin': [0, 0, 0]
    }

    # header
    header_end = buffer.find(b'\n\n')
    header_str = buffer[:header_end].decode('utf-8')
    lines = header_str.split('\n')

    for line in lines:
        line = line.strip()
        if not line or ':' not in line: continue
        key, value = line.split(':', 1)
        key, value = key.strip(), value.strip()

        if (key == 'space origin'):
            z, y, x = map(int, value.strip('()').split(','))
            header[key] = [z, y, x]
        if (key == 'sizes'):
            sizes = value.strip().split(' ')
            d, h, w = map(int, sizes)
            header[key] = [d, h, w]

    # data
    compressed_data = buffer[header_end+2:]
    encoding = header.get('encoding', 'raw').lower()
    if encoding == 'gzip':
        data = gzip.decompress(compressed_data)
    elif encoding == 'raw':
        data = compressed_data
    else:
        raise ValueError(f"unsupport encoding: {encoding}")

    return data, header

@app.route("/handle_nrrd", methods=["POST"])
def handle_nrrd():
    buffer = request.data
    data_length = len(buffer)
    data, header = parse_nrrd(buffer)

    size = header.get('sizes')[0]
    z, y, x = header.get('space origin')

    # x, y, z
    mask = np.frombuffer(data, dtype=np.uint8)
    mask = mask.reshape(size, size, size)
    mask = mask.copy()

    # file path
    mask_dir = f'/Users/yao/Desktop/cubes/{z:05}_{y:05}_{x:05}/{z:05}_{y:05}_{x:05}_mask.nrrd'
    mask_dir_backup = f'/Users/yao/Desktop/cubes/{z:05}_{y:05}_{x:05}/{z:05}_{y:05}_{x:05}_mask_backup.nrrd'
    tiff_dir_template = f'/Users/yao/Desktop/cubes/{z:05}_{y:05}_{x:05}/{z:05}_{y:05}_{x:05}_mask_' + '{:02}.tif'

    # backup
    if os.path.exists(mask_dir): os.rename(mask_dir, mask_dir_backup)

    # z, y, x
    nrrd.write(mask_dir, mask.transpose(2, 1, 0), header)

    if label_values:
        unique_labels = label_values
    else:
        unique_labels = np.unique(mask)
        unique_labels = unique_labels[unique_labels != 0]

    # for label_val in unique_labels:
    #     # label selection
    #     mask_label = np.where(mask == label_val, 255, 0).astype(np.uint8)

    #     # # smooth the mask
    #     # threshold = 0.5
    #     # mask_label = np.where(mask_label == label_val, 1, 0).astype(float)
    #     # smoothed = gaussian_filter(mask_label, sigma=[5, 5, 5])
    #     # mask_label = (smoothed > threshold).astype(np.uint8)
    #     # mask_label *= label_val

    #     # z, y, x
    #     tifffile.imwrite(tiff_dir_template.format(label_val), mask_label.transpose(2, 1, 0))

    # length
    return jsonify({"status": "success", "data_length": data_length})

