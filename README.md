# Dhaka Urban Cooling Inefficiency

This is a ongoing research.



**Author**

Nur Mohammad

---

## Overview


Input variables:

- NDVI
- NDBI
- Land Surface Temperature (LST)

Output:

- Efficient cooling
- Cooling inefficiency hotspots

---

## Workflow

### Google Earth Engine

1. Define study area
2. Load and preprocess Landsat 9 imagery
3. Calculate NDVI, NDBI and LST
4. Generate cooling inefficiency labels
5. Create raster stack
6. Extract spatial patch samples

### CNN Workflow

1. Load raster stack
2. Extract 32 × 32 image patches
3. Normalize predictor variables
4. Split training and testing data
5. Train CNN model
6. Predict cooling inefficiency hotspots

---

## Repository Structure

```text
gee/
    Google Earth Engine preprocessing scripts

notebooks/
    CNN implementation notebook

models/
    Information about trained models

data/
    Dataset descriptions

outputs/
    Model outputs and figures

docs/
    Project documentation
```

---

## Software Requirements

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## Reproducibility

Random seed was fixed to ensure reproducible model training and evaluation:

```python
SEED = 42
```

Deterministic TensorFlow operations were enabled whenever possible.

---

# ==========================================================
# STEP 0. REPRODUCIBILITY SETTINGS
# ==========================================================
# This step fixes random seeds and deterministic operations
# so that the CNN model can be reproduced as consistently as possible
# when using the same study area, same input data, same software environment,
# and same hardware configuration.

import os
import random
import numpy as np
import tensorflow as tf

SEED = 42

os.environ["PYTHONHASHSEED"] = str(SEED)
os.environ["TF_DETERMINISTIC_OPS"] = "1"
os.environ["TF_CUDNN_DETERMINISTIC"] = "1"

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

try:
    tf.config.experimental.enable_op_determinism()
except Exception:
    pass

print("Reproducibility seed fixed at:", SEED)

# For reproducibility, the random seed was fixed at 42 and deterministic TensorFlow operations were enabled. Exact numerical results may still vary slightly across different TensorFlow versions, GPU/CUDA configurations, and operating systems.

## Data Availability

Landsat imagery was accessed through:

- Google Earth Engine
- USGS archive

Raw datasets are not uploaded because of storage limitations.

The complete workflow can regenerate the datasets.

---


## License

MIT License
