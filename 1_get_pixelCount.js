// Perform apixel count by comparing QCN LCLUC maps and Mapbiomas Collection 5.0 maps
// For any issue/bug, please write to dhemerson.costa@ipam.org.br or edriano.souza@ipam.org.br
// Developed by: IPAM, SEEG and OC
// Citing: SEEG/Observatório do Clima and IPAM

/* @. Set user parameters *///
// Define classes to be assesed as 'reference class' into QCN
var list_classes = [1];
// Define years of Mapbiomas to be compared with QCN reference class
var list_mapb_years = [1985];

// Define reclassification matrix
var raw_mapbiomas = [3, 4, 5, 9, 11, 12, 13, 15, 20, 21, 23, 25, 29, 30, 32, 33, 36, 41];
var design1 =       [3, 4, 5, 9, 11, 12, 13, 15, 20, 21, 23, 25, 29, 30, 32, 33, 36, 41];
var design2 =       [3, 3, 3, 0,  0, 12,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0];

///////////////////////////////////////
/* @. Don't change below this line *///
///////////////////////////////////////

// Get color-ramp module
var vis = {
    'min': 0,
    'max': 45,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification5')
};

// Import LCLUC data
var qcn = ee.Image("users/edrianosouza/qcn/3b");
var colecao5 = ee.ImageCollection("projects/mapbiomas-workspace/COLECAO5/mapbiomas-collection50-integration-v8").mosaic();

// Import vectorial data
var eco_regions = ee.FeatureCollection('users/dhconciani/base/ECORREGIOES_CERRADO_V7');

// Create an empty table to receive data 
var table = ee.FeatureCollection([]);

// For each QCN reference class [i]
list_classes.forEach(function(class_i) {
  // Mask QCN only to reference class
  var qcn_i = qcn.updateMask(qcn.eq(class_i));
  
  // For each year of MapBiomas
  list_mapb_years.forEach(function(year_j){
    // Mask MapBiomas by QCN
    var mapb_qcn_ij = colecao5.select(['classification_' + year_j]).updateMask(qcn_i.eq(class_i));
    // Perform reclassification according definied matrix
    var mapb_qcn_ij_d1 = mapb_qcn_ij.remap(raw_mapbiomas, design1);
    var mapb_qcn_ij_d2 = mapb_qcn_ij.remap(raw_mapbiomas, design2);
    // Plot inspection                
    Map.addLayer(mapb_qcn_ij_d1, vis, 'D1 QCN:' + class_i + ' ' + 'MAPB:' + year_j);
    Map.addLayer(mapb_qcn_ij_d2, vis, 'D2 QCN:' + class_i + ' ' + 'MAPB:' + year_j);

    // Define function to count pixel by ecoregion
    // For design 1
    var compute_pixel_count_d1 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d1.reduceRegion({
                                    reducer: ee.Reducer.frequencyHistogram(),
                                    geometry: feature.geometry(),
                                    scale: 30,
                                    maxPixels: 1e13 });
      // transform pixel count into a dictionary structure
      var dict_ij = ee.Dictionary(ee.Number(count_ij.get('remapped')));
      // set as propertie into each feature
      return feature.set(dict_ij)
                    .set('ref_class', class_i)
                    .set('mapb_year', year_j)
                    .set('design', '1');
      };
      
    // For design 2
    var compute_pixel_count_d2 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d2.reduceRegion({
                                    reducer: ee.Reducer.frequencyHistogram(),
                                    geometry: feature.geometry(),
                                    scale: 30,
                                    maxPixels: 1e13 });
      // transform pixel count into a dictionary structure
      var dict_ij = ee.Dictionary(ee.Number(count_ij.get('remapped')));
      // set as propertie into each feature
      return feature.set(dict_ij)
                    .set('ref_class', class_i)
                    .set('mapb_year', year_j)
                    .set('design', '2');
      };
    
    // apply function to count pixels
    var eco_d1 = eco_regions.map(compute_pixel_count_d1);
    var eco_d2 = eco_regions.map(compute_pixel_count_d2);

    // merge counts for the class [i] and year [j] into a single table
    var eco_ij = eco_d1.merge(eco_d2);
    // merge with recipe table
        table = table.merge(eco_ij);
  });
});

// Print a sample of the table (the first element)
print (table.first());

// Export as CSV file to GDrive
Export.table.toDrive({
  collection: table,
  description: 'qcn_pixel_count',
  folder: 'gee',
  fileFormat: 'CSV'
});
