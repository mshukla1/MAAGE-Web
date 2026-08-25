define([
  'dojo/_base/declare', 'dojo/_base/lang',
  'dojo/on',
  '../store/PrivateGenomeMetadataJsonRest',
  './PageGrid', './GridSelector'
], function (
  declare, lang,
  on,
  Store,
  Grid, selector
) {

  var store = new Store({});

  return declare([Grid], {
    region: 'center',
    query: (this.query || ''),
    store: store,
    columns: {
      'Selection Checkboxes': selector({ unhidable: true }),
      genome_id: { label: 'Genome ID', field: 'genome_id', hidden: true },
      genome_name: { label: 'Genome Name', field: 'genome_name' },
      host_name: { label: 'Host Name', field: 'host_name' },
      isolation_country: { label: 'Isolation Country', field: 'isolation_country' },
      state_province: { label: 'State/Province', field: 'state_province' },
      city: { label: 'City', field: 'city' },
      county: { label: 'County', field: 'county', hidden: true },
      collection_date: { label: 'Collection Date', field: 'collection_date' },
      received_date: { label: 'Received Date', field: 'received_date', hidden: true },
      serovar: { label: 'Serovar', field: 'serovar' },
      pathovar: { label: 'Pathovar', field: 'pathovar', hidden: true },
      lineage: { label: 'Lineage', field: 'lineage', hidden: true },
      allele_code: { label: 'Allele Code', field: 'allele_code', hidden: true },
      antigen: { label: 'Antigen', field: 'antigen', hidden: true },
      toxin: { label: 'Toxin', field: 'toxin', hidden: true },
      toxin_wgs: { label: 'Toxin (WGS)', field: 'toxin_wgs', hidden: true },
      outbreak: { label: 'Outbreak', field: 'outbreak' },
      lab_id: { label: 'Lab ID', field: 'lab_id', hidden: true },
      patient_age: { label: 'Patient Age', field: 'patient_age', hidden: true }
    },
    startup: function () {
      var _self = this;
      this.on('dgrid-select', function (evt) {
        var newEvt = {
          rows: evt.rows,
          selected: evt.grid.selection,
          grid: _self,
          bubbles: true,
          cancelable: true
        };
        on.emit(_self.domNode, 'select', newEvt);
      });
      this.on('dgrid-deselect', function (evt) {
        var newEvt = {
          rows: evt.rows,
          selected: evt.grid.selection,
          grid: _self,
          bubbles: true,
          cancelable: true
        };
        on.emit(_self.domNode, 'deselect', newEvt);
      });
      this.inherited(arguments);
      this.refresh();
    }
  });
});
