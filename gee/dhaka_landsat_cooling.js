// 1. Define Study Area and Study Period


var aoi = ee.Geometry.Rectangle([90.25, 23.68, 90.55, 23.93]);

var startDate = '2025-01-01';
var endDate   = '2025-12-31';

Map.centerObject(aoi, 10);
Map.addLayer(aoi, {color:'red'}, 'Study Area');

print('Study Area Size (km²)');
print(aoi.area().divide(1e6));




// 2. Load, Mask, Scale and Preprocess Landsat 9


function maskScaleL9(image){

    var qa = image.select('QA_PIXEL');

    var cloudMask = qa.bitwiseAnd(1 << 1).eq(0)
      .and(qa.bitwiseAnd(1 << 2).eq(0))
      .and(qa.bitwiseAnd(1 << 3).eq(0))
      .and(qa.bitwiseAnd(1 << 4).eq(0));

    var opticalBands = image.select([
        'SR_B2',
        'SR_B3',
        'SR_B4',
        'SR_B5',
        'SR_B6',
        'SR_B7'
    ])
    .multiply(0.0000275)
    .add(-0.2);


    var lstKelvin = image.select('ST_B10')
      .multiply(0.00341802)
      .add(149.0)
      .rename('LST_K');


    var lstCelsius = lstKelvin
      .subtract(273.15)
      .rename('LST_C');


    return image
      .addBands(opticalBands,null,true)
      .addBands(lstKelvin,null,true)
      .addBands(lstCelsius)
      .updateMask(cloudMask)
      .clip(aoi);

}



// 3. Load Landsat 9 Collection and Calculate NDVI and NDBI


var landsat9 = ee.ImageCollection(
    'LANDSAT/LC09/C02/T1_L2'
)
.filterBounds(aoi)
.filterDate(startDate,endDate)
.filter(ee.Filter.lt('CLOUD_COVER',30))
.map(maskScaleL9);


print('Landsat Images Used');
print(landsat9.size());


function addIndices(image){

    var ndvi = image
      .normalizedDifference(['SR_B5','SR_B4'])
      .rename('NDVI');

    var ndbi = image
      .normalizedDifference(['SR_B6','SR_B5'])
      .rename('NDBI');

    return image.addBands([ndvi,ndbi]);

}

var landsatIndexed = landsat9.map(addIndices);




// 4. Create Median Composite


var composite = landsatIndexed
    .median()
    .clip(aoi);


var ndvi = composite.select('NDVI').toFloat();

var ndbi = composite.select('NDBI').toFloat();

var lstC = composite.select('LST_C').toFloat();



Map.addLayer(
    ndvi,
    {
      min:-0.2,
      max:0.8,
      palette:['blue','white','green']
    },
    'NDVI'
);


Map.addLayer(
    ndbi,
    {
      min:-0.5,
      max:0.5,
      palette:['green','white','brown']
    },
    'NDBI'
);


Map.addLayer(
    lstC,
    {
      min:20,
      max:40,
      palette:['blue','cyan','yellow','orange','red']
    },
    'LST'
);




// 5. Generate Cooling Inefficiency Labels



// Cooling Inefficiency:
// Areas where relatively high vegetation presence
// does not correspond with expected cooling
// and elevated LST persists.
//
// Labels:
//
// 0 = Efficient cooling
// 1 = Cooling inefficiency


var ndviThreshold = 0.35;

var lstThreshold = 32.0;


var coolingInefficiency = ndvi
    .gte(ndviThreshold)
    .and(
      lstC.gte(lstThreshold)
    )
    .rename('label')
    .toFloat();


Map.addLayer(
    coolingInefficiency,
    {
      min:0,
      max:1,
      palette:['blue','red']
    },
    'Cooling Inefficiency'
);




// 6. Build Final Multi-Layer Raster Stack


var validMask = ndvi.mask()
    .and(ndbi.mask())
    .and(lstC.mask());


var finalStack = ee.Image.cat([

    ndvi.rename('NDVI'),

    ndbi.rename('NDBI'),

    lstC.rename('LST_C'),

    coolingInefficiency.rename('label')

]).updateMask(validMask);


print('Final Raster Stack');
print(finalStack);


var labelStats = coolingInefficiency.reduceRegion({

    reducer:ee.Reducer.frequencyHistogram(),

    geometry:aoi,

    scale:30,

    maxPixels:1e13

});


print('Cooling Inefficiency Distribution');
print(labelStats);




// 7. Generate Random Patch Centers


var patchSizePixels = 32;

var scale = 30;

var halfPatchMeters =
    patchSizePixels*scale/2;


var patchCenters =
    ee.FeatureCollection.randomPoints({

        region:aoi,

        points:5000,

        seed:42,

        maxError:1

});


Map.addLayer(
    patchCenters,
    {color:'yellow'},
    'Initial Patch Centers'
);




// 8. Filter Patch Centers and Extract Samples


var innerAOI =
    aoi.buffer(
      -halfPatchMeters
    );


var validPatchCenters =
    patchCenters.filterBounds(
      innerAOI
    );


var sampledPatchCenters =
    finalStack.sampleRegions({

      collection:validPatchCenters,

      scale:scale,

      geometries:true

}).filter(
    ee.Filter.notNull([
        'NDVI',
        'NDBI',
        'LST_C',
        'label'
    ])
);


print('Patch Count After Filtering');
print(validPatchCenters.size());


print('Valid Samples');
print(sampledPatchCenters.size());


var class0 =
    sampledPatchCenters.filter(
      ee.Filter.eq(
        'label',0
      )
    );


var class1 =
    sampledPatchCenters.filter(
      ee.Filter.eq(
        'label',1
      )
    );


print('Efficient Cooling Samples');
print(class0.size());

print('Cooling Inefficiency Samples');
print(class1.size());



Map.addLayer(
    sampledPatchCenters,
    {color:'black'},
    'Final Samples'
);


// 9. Add Geographic Coordinates


var finalSamples =
    sampledPatchCenters.map(function(feature){

    var coords =
        feature.geometry()
        .coordinates();

    return feature.set({

        longitude:
        coords.get(0),

        latitude:
        coords.get(1)

    });

});


print('Sample Preview');
print(finalSamples.limit(10));




// 10. Export Training Data and Raster Stack



Export.table.toDrive({

    collection:finalSamples,

    description:
    'Dhaka_Patch_Centers_With_Labels_ALL_2025',

    fileFormat:'CSV'

});


Export.image.toDrive({

    image:finalStack.toFloat(),

    description:
    'Dhaka_DL_Stack_With_Label_ALL_2025',

    folder:
    'GEE_Exports',

    fileNamePrefix:
    'Dhaka_DL_Stack_With_Label_ALL_2025',

    region:aoi,

    scale:scale,

    maxPixels:1e13

});