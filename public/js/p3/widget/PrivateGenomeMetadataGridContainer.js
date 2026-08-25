define([
  'dojo/_base/declare', 'dojo/_base/lang',
  'dojo/dom-construct', 'dojo/on', 'dojo/topic', 'dojo/request', 'dojo/_base/Deferred',
  'dijit/TooltipDialog', 'dijit/popup', 'dijit/Dialog',
  './GridContainer', './PrivateGenomeMetadataGrid', './PerspectiveToolTip', './SelectionToGroup',
  '../util/PathJoin', './AdvancedSearchFields', './PermissionEditor', '../DataAPI'
], function (
  declare, lang,
  domConstruct, on, Topic, request, Deferred,
  TooltipDialog, popup, Dialog,
  GridContainer, Grid, PerspectiveToolTipDialog, SelectionToGroup,
  PathJoin, AdvancedSearchFields, PermissionEditor, DataAPI
) {

  const dfc = '<div>Download Table As...</div><div class="wsActionTooltip" rel="text/tsv">Text</div><div class="wsActionTooltip" rel="text/csv">CSV</div><div class="wsActionTooltip" rel="application/vnd.openxmlformats">Excel</div>';
  const downloadTT = new TooltipDialog({
    content: dfc,
    onMouseLeave: function () {
      popup.close(downloadTT);
    }
  });

  return declare([GridContainer], {
    containerType: 'private_genome_metadata_data',
    tutorialLink: 'quick_references/organisms_taxon/private_genome_metadata.html',
    tooltip: 'The "Private Genome Metadata" tab lists restricted metadata attributes associated with genomes, including host, isolation, typing, and outbreak information.',
    facetFields: AdvancedSearchFields['private_genome_metadata'].filter((ff) => ff.facet),
    advancedSearchFields: AdvancedSearchFields['private_genome_metadata'].filter((ff) => ff.search),
    dataModel: 'private_genome_metadata',
    primaryKey: 'id',
    containerActions: GridContainer.prototype.containerActions.concat([
      [
        'DownloadTable',
        'fa icon-download fa-2x',
        {
          label: 'DOWNLOAD',
          multiple: false,
          validTypes: ['*'],
          tooltip: 'Download Table',
          tooltipDialog: downloadTT
        },
        function () {
          const _self = this;

          const totalRows = _self.grid.totalRows;
          const dataType = _self.dataModel;
          const primaryKey = _self.primaryKey;
          const currentQuery = _self.grid.get('query');
          const query = `${currentQuery}&sort(${primaryKey})&limit(${totalRows})`;

          on(downloadTT.domNode, 'div:click', function (evt) {
            const typeAccept = evt.target.attributes.rel.value;

            const baseUrl = `${PathJoin(window.App.dataServiceURL, dataType)}/?http_accept=${typeAccept}&http_download=true`;

            const form = domConstruct.create('form', {
              style: 'display: none;',
              id: 'downloadForm',
              enctype: 'application/x-www-form-urlencoded',
              name: 'downloadForm',
              method: 'post',
              action: baseUrl
            }, _self.domNode);
            domConstruct.create('input', {
              type: 'hidden',
              value: encodeURIComponent(query),
              name: 'rql'
            }, form);
            if (window.App.authorizationToken) {
              domConstruct.create('input', {
                type: 'hidden',
                value: window.App.authorizationToken,
                name: 'http_authorization'
              }, form);
            }
            form.submit();

            popup.close(downloadTT);
          });

          popup.open({
            popup: this.containerActionBar._actions.DownloadTable.options.tooltipDialog,
            around: this.containerActionBar._actions.DownloadTable.button,
            orient: ['below']
          });
        },
        true,
        'left'
      ]
    ]),
    selectionActions: GridContainer.prototype.selectionActions.concat([
      [
        'ViewGenomeItem',
        'MultiButton fa icon-selection-Genome fa-2x',
        {
          label: 'GENOME',
          validTypes: ['*'],
          multiple: false,
          tooltip: 'Switch to Genome View. Press and Hold for more options.',
          ignoreDataType: true,
          validContainerTypes: ['private_genome_metadata_data'],
          pressAndHold: function (selection, button, opts, evt) {
            popup.open({
              popup: new PerspectiveToolTipDialog({ perspectiveUrl: '/view/Genome/' + selection[0].genome_id }),
              around: button,
              orient: ['below']
            });
          }
        },
        function (selection) {
          var sel = selection[0];
          Topic.publish('/navigate', { href: '/view/Genome/' + sel.genome_id, target: 'blank' });
        },
        false
      ],
      [
        'AddGroup',
        'fa icon-object-group fa-2x',
        {
          label: 'GROUP',
          ignoreDataType: true,
          multiple: true,
          validTypes: ['*'],
          requireAuth: true,
          max: 10000,
          tooltip: 'Add selection to a new or existing group',
          validContainerTypes: ['private_genome_metadata_data']
        },
        function (selection, containerWidget) {
          var dlg = new Dialog({ title: 'Add selected items to group' });
          var stg = new SelectionToGroup({
            selection: selection,
            type: 'genome_group',
            path: ''
          });
          on(dlg.domNode, 'dialogAction', function (evt) {
            dlg.hide();
            setTimeout(function () {
              dlg.destroy();
            }, 2000);
          });
          domConstruct.place(stg.domNode, dlg.containerNode, 'first');
          stg.startup();
          dlg.startup();
          dlg.show();
        },
        false
      ],
      [
        'ShareMetadata',
        'fa icon-user-plus fa-2x',
        {
          label: 'SHARE',
          ignoreDataType: true,
          multiple: true,
          validTypes: ['*'],
          requireAuth: true,
          tooltip: 'Share metadata record(s) with other users',
          validContainerTypes: ['private_genome_metadata_data']
        },
        function (selection, containerWidget) {
          var self = this;

          var initialPerms = DataAPI.solrPermsToObjs(selection);

          // 'r'/'w' values from PermissionEditor map to 'read'/'write' for the API
          var permMapping = { r: 'read', w: 'write', 'Can view': 'read', 'Can edit': 'write' };

          var onConfirm = function (newPerms) {
            var ids = selection.map(function (s) { return s.id; });

            Topic.publish('/Notification', {
              message: "<span class='default'>Updating permissions...</span>",
              type: 'default',
              duration: 50000
            });

            var payload = JSON.stringify(newPerms.map(function (p) {
              return { user: p.user, permission: permMapping[p.permission] || p.permission };
            }));

            request.post(PathJoin(window.App.dataServiceURL, 'permissions/private_genome_metadata', ids.join(',')), {
              handleAs: 'json',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': null,
                'Authorization': window.App.authorizationToken || ''
              },
              data: payload
            }).then(function () {
              Topic.publish('/Notification', { message: 'Permissions updated.', type: 'message' });
              self.grid.refresh();
            }, function (err) {
              Topic.publish('/Notification', {
                message: 'Failed to update permissions. ' + (err.response && err.response.status || ''),
                type: 'error'
              });
            });
          };

          var permEditor = new PermissionEditor({
            selection: selection,
            onConfirm: onConfirm,
            user: window.App.user.id || '',
            useSolrAPI: true,
            permissions: initialPerms
          });

          permEditor.show();
        },
        false
      ]
    ]),
    gridCtor: Grid
  });
});
