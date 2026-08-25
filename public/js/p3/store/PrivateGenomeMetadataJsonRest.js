define([
  'dojo/_base/declare',
  './P3JsonRest'
], function (
  declare,
  Store
) {
  return declare([Store], {
    dataModel: 'private_genome_metadata',
    idProperty: 'id',
    facetFields: []
  });
});
