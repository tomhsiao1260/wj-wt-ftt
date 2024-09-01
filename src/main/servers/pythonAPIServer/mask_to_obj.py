import json
import nrrd
import tifffile
import numpy as np
import open3d as o3d
from scipy.spatial import Delaunay
from skimage.morphology import skeletonize

centerPath = 'center.json'
maskPath = '../../../../../mask-to-mesh-test/01744_02256_02768/01744_02256_02768_mask.nrrd'
volumePath = '../../../../../mask-to-mesh-test/01744_02256_02768/01744_02256_02768_volume.nrrd'

# mask: z, y, x, coords: z, y, x
def mask_to_obj(mask, label=1, coords=(0, 0, 0)):
    mask = np.where(mask == label, 255, 0).astype(np.uint8)
    maskSkeleton = np.zeros_like(mask)

    for i in range(mask.shape[0]):
        maskSkeleton[i, :, :] = skeletonize(mask[i, :, :])

    # points: x, y, z
    points = np.argwhere(maskSkeleton)
    points = points[np.random.choice(len(points), int(len(points) * 0.05), replace=False)]
    points = points[:, [2, 1, 0]]

    z, y, x = coords
    points += np.array([x, y, z])

    uvs = compute_uvs(points)

    colors = np.zeros((len(uvs), 3)).astype(np.float16)

    colors[:, 0] = uvs[:, 0]
    colors[:, 1] = uvs[:, 1]
    colors[:, 2] = 1

    point_cloud = o3d.geometry.PointCloud()
    point_cloud.points = o3d.utility.Vector3dVector(points)
    point_cloud.colors = o3d.utility.Vector3dVector(colors)
    # o3d.io.write_point_cloud("points.ply", point_cloud)

    tri = Delaunay(uvs)
    faces = tri.simplices

    triangle_uvs = uvs[faces].reshape(-1, 2)

    mesh = o3d.geometry.TriangleMesh()
    mesh.vertices = o3d.utility.Vector3dVector(points)
    mesh.triangles = o3d.utility.Vector3iVector(faces)
    mesh.triangle_uvs = o3d.utility.Vector2dVector(triangle_uvs)
    compute_normals(mesh)

    o3d.io.write_triangle_mesh('segment.obj', mesh)

# update normals
def compute_normals(mesh):
  if not mesh.triangle_normals:
    mesh.compute_vertex_normals()
    mesh.triangle_normals = o3d.utility.Vector3dVector([])
  else:
    mesh.compute_vertex_normals()
    mesh.compute_triangle_normals()

# save label as tif
def visualize_mask(mask, label=1):
    # mask: z, y, x
    mask = np.where(mask == label, 255, 0).astype(np.uint8)
    tifffile.imwrite('mask.tif', mask)

def compute_uvs(points):
    center = get_center(points)

    p = points - center
    x, y, z = p[:, 0], p[:, 1], points[:, 2]

    ymin, ymax = np.min(y), np.max(y)
    zmin, zmax = np.min(z), np.max(z)

    angle = np.arctan2(y, x)
    amin, amax = np.min(angle), np.max(angle)

    v = (z - zmin) / (zmax - zmin)
    u = (angle - amin) / (amax - amin)
    # v = (y - ymin) / (ymax - ymin)

    uvs = np.column_stack((u, v))
    return uvs

# center x, y, z
def get_center(points):
    with open(centerPath, 'r') as f: data = json.load(f)

    center = [(p['x'], p['y'], p['z']) for p in data['center']]
    center = np.array(center)

    # In coords=(0, 0, 0) case, use cube center instead
    # center[:, 0] = 128
    # center[:, 1] = 128

    x = np.interp(points[:, 2], center[:, 2], center[:, 0])
    y = np.interp(points[:, 2], center[:, 2], center[:, 1])
    z = points[:, 2]

    return np.column_stack((x, y, z))

if __name__ == "__main__":
    mask, header = nrrd.read(maskPath)
    volume, header = nrrd.read(volumePath)

    # mask_to_obj(mask, 2, (0, 0, 0))
    mask_to_obj(mask, 2, (1744, 2256, 2768))
    visualize_mask(mask, 2)


