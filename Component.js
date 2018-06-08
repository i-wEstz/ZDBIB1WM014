sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"iam/swish/GenQrBarcode/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	var navigationWithContext = {

	};

	return UIComponent.extend("iam.swish.GenQrBarcode.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// set the dataSource model
			this.setModel(new sap.ui.model.json.JSONModel({}), "dataSource");

			// set application model
			var oApplicationModel = new sap.ui.model.json.JSONModel({});
			this.setModel(oApplicationModel, "applicationModel");

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();

			// var mConfig = this.getMetadata().getConfig();
			// var sServiceUrl = mConfig.serviceConfig.serviceUrl;
			// var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl,{
			// 	json: true,
			// 	loadMetadataAsync: true
			// });
			// this.setModel(oModel);

		},

		createContent: function() {
			var app = new sap.m.App({
				id: "App"
			});
			var appType = "App";
			var appBackgroundColor = "#FFFFFF";
			if (appType === "App" && appBackgroundColor) {
				app.setBackgroundColor(appBackgroundColor);
			}

			return app;
		},

		getNavigationPropertyForNavigationWithContext: function(sEntityNameSet, targetPageName) {
			var entityNavigations = navigationWithContext[sEntityNameSet];
			return entityNavigations == null ? null : entityNavigations[targetPageName];
		}
	});

});