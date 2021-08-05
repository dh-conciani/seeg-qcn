// Perform apixel count by comparing QCN LCLUC maps and Mapbiomas Collection 5.0 maps v1.1
// For any issue/bug, please write to dhemerson.costa@ipam.org.br or edriano.souza@ipam.org.br
// Developed by: IPAM, SEEG and OC
// Citing: SEEG/Observatório do Clima and IPAM

// @. UPDATE HISTORIC //
// 1:   Count pixel by design
// 1.1: Perform correction of QCN by following rules
// @. ~~~~~~~~~~~~~~ // 
 
/* @. Set user parameters *///
// Define classes to be assesed as 'reference class' into QCN
var list_classes = [1];
// Define years of Mapbiomas to be compared with QCN reference class
var list_mapb_years = [1985];

// É possível extrair para os demais anos?
//var list_mapb_years = ['1985','1986','1987','1988','1989','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'];


// Define reclassification matrix
var raw_mapbiomas = [3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 36, 39, 41];   // Palets add other new classes 
var design1 =       [3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32, 33, 36, 39, 41];   // Equal eg. raw_mapbiomas
var design2 =       [3, 3, 3, 0,  0, 11, 12, 13, 0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0];    // SEEG Regeneração {Group Forest} and {Non Forest Natural Formation (Wetland/Grassland/ONFNF)}
var design3 =       [3, 3, 3, 9,  0, 11, 12, 13, 0,  15, 18,  0,  0, 21,  0, 23, 24, 25,  0, 29,  0,  0, 32,  0,  0,  0, 0];    // Include {previous} + {Farming} and {Non vegetated area} 
var design4 =       [3, 3, 3, 0,  0, 0,  12,  0, 0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0];    // Just {Group Forest) vs {Grassland}
var design5 =       [3, 0, 0, 0,  0, 0,  0,  0, 0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0];    // Ungroup {Forest) + Grass 
var design6 =       [3, 4, 5, 9,  0, 11, 12, 13, 0,  15, 18,  0,  0, 21,  0,  0,  0,  0,  0,  0,  0,  0, 32,  0,  0,  0, 0];    // Include {previous}  + and {Non Forest Natural Formation (Wetland/Grassland/ONFNF)}
var design7 =       [3, 4, 5, 0,  0,  0,  0,  0, 0,   0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 0];    // Ungroup {Forest} 

///////////////////////////////////////
/* @. Don't change below this line *///
///////////////////////////////////////

// Get color-ramp module
var vis = {
    'min': 0,
    'max': 45,
    'palette': require('users/mapbiomas/modules:Palettes.js').get('classification5')
};

// pre-definied palletes
var pal = require('users/gena/packages:palettes');
var palt = pal.matplotlib.viridis[7];
var pala = pal.kovesi.rainbow_bgyr_35_85_c72[7];

// total stock
var cer_tot = ee.Image('users/edrianosouza/QCN/cer_cagb');
var soc = ee.Image('users/edrianosouza/soil_co2/BR_SOCstock_0-30_t_ha');

// brazilian states
var states = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');
Map.addLayer(states.randomVisualizer(), {}, 'states');

// Import LCLUC data
var qcn = ee.Image("users/edrianosouza/qcn/12b");
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
    var mapb_qcn_ij_d3 = mapb_qcn_ij.remap(raw_mapbiomas, design3);
    var mapb_qcn_ij_d4 = mapb_qcn_ij.remap(raw_mapbiomas, design4);
    var mapb_qcn_ij_d5 = mapb_qcn_ij.remap(raw_mapbiomas, design5);
    var mapb_qcn_ij_d6 = mapb_qcn_ij.remap(raw_mapbiomas, design6);
    var mapb_qcn_ij_d7 = mapb_qcn_ij.remap(raw_mapbiomas, design7);
    
    // Plot inspection                
    Map.addLayer(mapb_qcn_ij_d1, vis, 'D1 QCN:' + class_i + ' ' + 'MAPB:' + year_j, false);
    Map.addLayer(mapb_qcn_ij_d2, vis, 'D2 QCN:' + class_i + ' ' + 'MAPB:' + year_j, false);
    Map.addLayer(mapb_qcn_ij_d3, vis, 'D3 QCN:' + class_i + ' ' + 'MAPB:' + year_j, false);
    Map.addLayer(mapb_qcn_ij_d4, vis, 'D4 QCN:' + class_i + ' ' + 'MAPB:' + year_j, false);
    Map.addLayer(mapb_qcn_ij_d5, vis, 'D5 QCN:' + class_i + ' ' + 'MAPB:' + year_j, true);
    Map.addLayer(mapb_qcn_ij_d6, vis, 'D6 QCN:' + class_i + ' ' + 'MAPB:' + year_j, false);
    Map.addLayer(mapb_qcn_ij_d7, vis, 'D7 QCN:' + class_i + ' ' + 'MAPB:' + year_j, false);
    Map.addLayer(qcn, {color:'blue'}, "D0-1985", false);
    Map.addLayer(cer_tot, {min: 0, max: 168, palette: palt}, 'Cerrado_Tot');
    
    // @. update of v1.1 .@ //
    // perform QCN correction by brazilian state //
    var cer_tot_rect = cer_tot.where(states.eq(11).and(mapb_qcn_ij_d5.eq(3)), 79.80779548); // RO
        cer_tot_rect = cer_tot_rect.where(states.eq(17).and(mapb_qcn_ij_d5.eq(3)), 64.27657895); // TO
        cer_tot_rect = cer_tot_rect.where(states.eq(21).and(mapb_qcn_ij_d5.eq(3)), 63.91879963); // MA
        cer_tot_rect = cer_tot_rect.where(states.eq(22).and(mapb_qcn_ij_d5.eq(3)), 66.068241);   // PI
        cer_tot_rect = cer_tot_rect.where(states.eq(29).and(mapb_qcn_ij_d5.eq(3)), 67.18329178); // BA
        cer_tot_rect = cer_tot_rect.where(states.eq(31).and(mapb_qcn_ij_d5.eq(3)), 70.08654663); // MG
        cer_tot_rect = cer_tot_rect.where(states.eq(35).and(mapb_qcn_ij_d5.eq(3)), 84.98800092); // SP
        cer_tot_rect = cer_tot_rect.where(states.eq(41).and(mapb_qcn_ij_d5.eq(3)), 74.98246537); // PR
        cer_tot_rect = cer_tot_rect.where(states.eq(50).and(mapb_qcn_ij_d5.eq(3)), 99.27158356); // MS
        cer_tot_rect = cer_tot_rect.where(states.eq(51).and(mapb_qcn_ij_d5.eq(3)), 93.55501847); // MT
        cer_tot_rect = cer_tot_rect.where(states.eq(52).and(mapb_qcn_ij_d5.eq(3)), 70.01143121); // GO
        cer_tot_rect = cer_tot_rect.where(states.eq(53).and(mapb_qcn_ij_d5.eq(3)), 66.8596976);  // DF
    
    // plot inspection
    Map.addLayer(cer_tot_rect,  {min: 0, max: 168, palette: palt}, 'cer_tot_rect');
    // @. end of the update .@// 

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
      
    // For design 3
    var compute_pixel_count_d3 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d3.reduceRegion({
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
                    .set('design', '3');
      };
    // For design 4
    var compute_pixel_count_d4 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d4.reduceRegion({
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
                    .set('design', '4');
      };
    // For design 5
    var compute_pixel_count_d5 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d5.reduceRegion({
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
                    .set('design', '5');
      };
    // For design 6
    var compute_pixel_count_d6 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d6.reduceRegion({
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
                    .set('design', '6');
      }; 
    // For design 7
    var compute_pixel_count_d7 = function(feature){
      // contar numero de pixels
      var count_ij = mapb_qcn_ij_d7.reduceRegion({
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
                    .set('design', '7');
      };
      
    // apply function to count pixels
    var eco_d1 = eco_regions.map(compute_pixel_count_d1);
    var eco_d2 = eco_regions.map(compute_pixel_count_d2);
    var eco_d3 = eco_regions.map(compute_pixel_count_d3);
    var eco_d4 = eco_regions.map(compute_pixel_count_d4);
    var eco_d5 = eco_regions.map(compute_pixel_count_d5);
    var eco_d6 = eco_regions.map(compute_pixel_count_d6);
    var eco_d7 = eco_regions.map(compute_pixel_count_d7);
    
    // merge counts for the class [i] and year [j] into a single table
    var eco_ij = eco_d1.merge(eco_d2).merge(eco_d3).merge(eco_d4).merge(eco_d5).merge(eco_d6).merge(eco_d7);
    // merge with recipe table
        table = table.merge(eco_ij);
  });
});

// Print a sample of the table (the first element)
print (table);

// Export as CSV file to GDrive
Export.table.toDrive({
  collection: table,
  description: 'qcn_pixel_count_2018',
  folder: 'gee_st1',
  fileFormat: 'CSV'
});
