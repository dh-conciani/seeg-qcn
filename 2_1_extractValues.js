// Extract values of reference data by using stratified random sampling
// For any issue/bug, please write to dhemerson.costa@ipam.org.br or edriano.souza@ipam.org.br
// Developed by: IPAM, SEEG and OC
// Citing: SEEG/Observatório do Clima and IPAM

// define asset folder with sample points
var root = 'users/dhconciani/SEEG/samples/v1';

// define files to be used in the extraction
var filesList = ['1k', '5k', '10k', '25k', '50k'];

// reference data 
var agb = ee.Image('users/edrianosouza/QCN/cer_cagb'); // Estoque de carbono aéreo (QCN, 2020)
var bgb = ee.Image('users/edrianosouza/QCN/cer_cbgb'); // Estoque de carbono subterrâneo (QCN, 2020)
var cdw = ee.Image('users/edrianosouza/QCN/cer_cdw'); // Estoque de carbono madeira morta (QCN, 2020)
var clitter = ee.Image('users/edrianosouza/QCN/cer_clitter'); // Estoque de carbono serapilheira (QCN, 2020)
var cer_tot = ee.Image('users/edrianosouza/QCN/cer_ctotal4inv'); // Estoque total de carbono {Total = agb+bgb+cdw+litter} (QCN, 2020)
var soc = ee.Image('users/edrianosouza/soil_co2/BR_SOCstock_0-30_t_ha'); // Estoque de Carbono Orgânico no Solo - "SOC" (EMBRAPA, 2016-20)

// states 
var states = ee.Image('projects/mapbiomas-workspace/AUXILIAR/estados-2016-raster');

// stack data
var stack = agb.addBands(bgb).addBands(cdw).addBands(clitter)
               .addBands(cer_tot).addBands(soc).addBands(states)
               .rename('AGB', 'BGB', 'CDW', 'CLITTER', 'TOTAL', 'SOC', 'STATE');
            
// extract by file
filesList.forEach(function(process_file) {
  // load points
  var points = ee.FeatureCollection(root + '/' + 'qcn_points_' + process_file);
  // print relatory
  print('when file is ' + process_file + ', the sum of points is:',  points.size());
  // extract values
  var values = stack.sampleRegions({
    // Get the sample from the polygons FeatureCollection.
    collection: points,
    // Set the scale to get Landsat pixels in the polygons.
    scale: 30
  });
  
  // print example
  print('example of the extracted data:', values.first());
  // add on the map
  Map.addLayer(points, {}, process_file + ' points');
  
  // Export as CSV file to GDrive
  Export.table.toDrive({
    collection: values,
    description: process_file + '_values',
    folder: 'gee3',
    fileFormat: 'CSV'
  });
  
});

// plot stack 
Map.addLayer(stack.randomVisualizer(), {}, 'stack');
