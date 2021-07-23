// Create a per-pixel stratified random sampling over reference data
// For any issue/bug, please write to dhemerson.costa@ipam.org.br or edriano.souza@ipam.org.br
// Developed by: IPAM, SEEG and OC
// Citing: SEEG/Observatório do Clima and IPAM

/* @. Set user parameters *///
// Define the number of pixels to be sampled by eco region
var sampleSize = 50000;     
var nSamplesMin = sampleSize/100*5; // 5% criteria

// Define reclassification matrix
var raw_mapbiomas = [3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 36, 39, 41];   
var design1 =       [3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 36, 39, 41];  

// Define export parameters
var dirout = 'users/dhconciani/SEEG/samples/v1';
var filename = 'qcn_points_' + sampleSize/1e+03 + 'k';

///////////////////////////////////////
/* @. Don't change below this line *///
///////////////////////////////////////

// Get color-ramp module
var vis = {
    'min': 0,
    'max': 45,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification5')
};

// Import LCLUC images
var qcn = ee.Image("users/edrianosouza/qcn/3"); // QCN - LCLUC
var colecao5 = ee.ImageCollection("projects/mapbiomas-workspace/COLECAO5/mapbiomas-collection50-integration-v8").mosaic(); // Mapbiomas - LCLUC

// Import vectorial data
var eco_regions = ee.FeatureCollection('users/dhconciani/base/ECORREGIOES_CERRADO_V7'); 
var cerrado = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/biomas').filterMetadata('name', 'equals', 'CERRADO');
var states = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/estados-2017').filterBounds(cerrado);

// Mask QCN only to reference class
  var qcn_i = qcn.updateMask(qcn.eq(1));
  
    // For each year of MapBiomas
    var mapb_qcn_ij = colecao5.select(['classification_' + '1985']).updateMask(qcn_i.eq(1));
    
     // Perform reclassification according definied matrix
    var mapb_qcn_ij_d1 = mapb_qcn_ij.remap(raw_mapbiomas, design1);
    
    // define function to generate stratified random sampling by ecoregion
    var computePoints = function(feature){
      // perform the count of pixels by state
      var count_ij = mapb_qcn_ij_d1.reduceRegion({
                                    reducer: ee.Reducer.frequencyHistogram(),
                                    geometry: feature.geometry(),
                                    scale: 30,
                                    maxPixels: 1e13 });
      // transform pixel count into a dictionary structure
      var dict_ij = ee.Dictionary(ee.Number(count_ij.get('remapped')));
      // set as propertie into each feature
      feature = feature.set(dict_ij);
      
      // Extract total count by each class
        var forest = ee.Number(feature.get('3'));
        var savanna = ee.Number(feature.get('4'));
        var grassland = ee.Number(feature.get('12'));
        var pasture = ee.Number(feature.get('15'));
      
        // compute the sum 
        var total = forest.add(savanna).add(grassland).add(pasture);
                            
        // compute the number of samples proportionally for each class
         var forestSize = ee.Number(forest).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
         var savannaSize = ee.Number(savanna).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
         var grasslandSize = ee.Number(grassland).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
         var pastureSize = ee.Number(pasture).divide(total).multiply(sampleSize).round().int16().max(nSamplesMin);
       
        // transform feature into geometry
        var clippedGrid = ee.Feature(feature).geometry();
        // clip data for the geometry
        var referenceMap =  mapb_qcn_ij_d1.clip(clippedGrid);
        
        // compute stratified points by state
        var samplingPoints = referenceMap.stratifiedSample({scale:30, classBand: 'remapped', numPoints: 0, 
                                region: feature.geometry(),
                                seed: 1, 
                                geometries: true,
                                classValues: [3, 4, 12, 15], 
                                classPoints: [forestSize, savannaSize, grasslandSize, pastureSize]
    });
  
    var training = samplingPoints.map(function(feat) {return feat});
    
    return (training);
    };
    
    // generate stratified random sampling by ecoregion
    var points = eco_regions.map(computePoints).flatten();

// print diagnosis
print ('example', points.first());
print ('total size', points.size());

Map.addLayer(mapb_qcn_ij_d1, vis, 'mapbiomas');
Map.addLayer(points, {}, 'points');

Export.table.toAsset(points,
  filename,
  dirout + '/' + filename);
