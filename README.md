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

To improve reproducibility, fixed random seeds and deterministic TensorFlow operations were used throughout model development.

Settings:

- Fixed random seed: `42`
- Fixed NumPy random state
- Fixed TensorFlow random state
- Fixed Python hash seed
- Deterministic TensorFlow operations enabled
- CuDNN deterministic mode enabled when supported

The workflow was designed so that the same study area, input data, and software environment produce consistent results across repeated model runs.

Example implementation:

```python
SEED = 42

random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)
```

Note:

Exact numerical values may still vary slightly across different hardware configurations (CPU/GPU), TensorFlow versions, CUDA libraries, and operating systems.

## Data Availability

Landsat imagery was accessed through:

- Google Earth Engine
- USGS archive

Raw datasets are not uploaded because of storage limitations.

The complete workflow can regenerate the datasets.

---

## Disclaimer

The research design, methodological framework, data preparation strategy, labeling criteria, analysis, interpretation of results, and scientific conclusions were developed by the author.

AI-assisted coding support (including Claude Sonnet and conversational AI tools) was used during parts of the software implementation process to assist with code development, debugging, code organization, and documentation. All generated code and outputs were reviewed, modified, validated, and finalized by the author before use in this study.

## License

MIT License
