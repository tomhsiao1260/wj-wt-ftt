# wj-wt-ftt


![RELEASE](https://img.shields.io/badge/RELEASE-0.1.0-green) <img src="https://img.shields.io/discord/1093137029157621840?style=flat&logo=discord&logoColor=white&label=Discord&color=%23404eed" /> ![Vesuvius Challenge](https://img.shields.io/badge/Vesuvius-Challenge-F5653F)


## Preprocess

Take cube `02000_02256_03024` as an example.

[Download Link](https://dl.ash2txt.org/full-scrolls/Scroll1/PHercParis4.volpkg/seg-volumetric-labels/cubes_renamed/02000_02256_03024/)

Create a folder (name it whatever you want)  and add a `meta.json` file in it. Here's the file structure.

```json
.
├── meta.json
├── 02000_02256_03024_mask.nrrd
└── 02000_02256_03024_volume.nrrd
```

This is how meta.json look like.

```json
{
  "chunks": [
    {
      "mask": "02000_02256_03024_mask.nrrd",
      "volume": ["02000_02256_03024_volume.nrrd"],
      "segments": [],
      "z": 2000,
      "y": 2256,
      "x": 3024,
      "size": 256
    }
  ]
}
```

## Usage

### 1. Open the app

Open [wj-wt-ftt](https://wj-wt-ftt.vercel.app/)  and select that folder you created before. You will be asked to authorize the app to read data; select "Confirm" to continue. Once loaded, you will see the `z slice` view on it. The purple part indicates the label in `mask.nrrd`. Now we're at `label 1`. Look at the GUI panel on the right hand side and switch to the `label 2` mode.

### 2. XYZ slices switching via keyboard

Try pressing x, y, z key to switch between different axis. You can also press space and then slide the wheel to zoom in & out.

### 3. Slice browsing

Back to Z slice and slide the wheel without pressing the space key. You can browse the slice in this way and then inspect your current slice location via the GUI panel.

### 4. Mask editing

You can paint the label on a given slice via left click. Press e key to switch to the erase mode. Press shift and slice the wheel can change the painting area. You can do these steps via GUI panel instead.

### 5. Labeling

Now, let's label an area using the tricks mentioned above. We recommend using `larger dot & depth` values to roughly outline a segment. Once finished, you can erase them with a smaller values.

### 6. 3D view

Hold down the spacebar and then drag the screen. You will jump into the 3D view to see the region that you label. If you get loss, release the space key and press x, y, z key can back to the slice mode. You will automatically return to slice mode as well if your camera happens to be aligned with an axis. You can also use the GUI panel to find a clearer way of displaying those data.

### 7. Segment display (optional)

If you want to display a given segment on it, please make sure it is cut into a smaller region. You can write your own script or use the following script instead.

[Download Link](https://gist.github.com/tomhsiao1260/918baa082ddb3de4860734dc1d5c751c)

Once finished, put the segment .obj data into the folder and update the meta.json:

```json
{
  "chunks": [
    {
      "mask": "02000_02256_03024_mask.nrrd",
      "volume": ["02000_02256_03024_volume.nrrd"],
      "segments": ["02000_02256_03024_20230702185753.obj"],
      "z": 2000,
      "y": 2256,
      "x": 3024,
      "size": 256
    }
  ]
}
```

### 8. Multiple volume compare (optional)

You can also put multiple volumes and then press the number key to compare them dynamically. For example, for the meta.json config as follow. You can switch between volume_A and volume_B when pressing `1 and 2 number key`, respectively.

```json
{
  "chunks": [
    {
      ...
      "volume": ["volume_A.nrrd", "volume_B.nrrd"],
      ...
    }
  ]
}

```

For example, if you want to compare and visualize the intermediate states in ThaumatoAnakalyptor pipeline, you can turn those intermediate result into different nrrd data (in Unit8 format) and then visualize them in this way. Here's a small guide of how you can generate those data:

https://github.com/tomhsiao1260/pipeline-visualize