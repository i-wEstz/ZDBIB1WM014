sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MessageBox, Utilities, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("iam.swish.GenQrBarcode.controller.Dialog3", {
		
		fnCallBack : null,
		
		addCallBack : function(fn){
			this.fnCallBack = fn;
		},
		
		setRouter: function(oRouter) {
			this.oRouter = oRouter;

		},
		getBindingParameters: function() {
			return {};

		},
		_onButtonPress: function() {
			var oDialog = this.getView().getContent()[0];
			var Matdoc = this.getView().byId("matdoc").getValue();
			var plant = this.getView().byId("plant").getValue();
			var sloc = this.getView().byId("sloc").getValue();
			var postdate = this.getView().byId("postdate").getValue();
			var filters = [];
			if(Matdoc){
			filters.push(new Filter("MaterialDocumentNo", FilterOperator.Contains, Matdoc));
			}
			if(sloc){
			filters.push(new Filter("SLOC", FilterOperator.Contains, sloc));
			}
			if(plant){
			filters.push(new Filter("Plant", FilterOperator.Contains, plant));
			}
			if(postdate){
			filters.push(new Filter("PostingDate", FilterOperator.Contains, postdate));
			}
			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterClose", null, fnResolve);
				oDialog.close();
				this.fnCallBack(filters);
			}.bind(this));

		},
		_onButtonPress1: function() {
			var oDialog = this.getView().getContent()[0];

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterClose", null, fnResolve);
				oDialog.close();
			});

		},
		onInit: function() {
			this._oDialog = this.getView().getContent()[0];

		},
		onExit: function() {
			this._oDialog.destroy();

		}
	});
}, /* bExport= */ true);