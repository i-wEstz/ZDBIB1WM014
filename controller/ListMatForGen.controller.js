sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"./JsBarcode",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, Barcode, History) {
	"use strict";

	return BaseController.extend("iam.swish.GenQrBarcode.controller.ListMatForGen", {
		address: "",
		handleRouteMatched: function(oEvent) {

			var oParams = {};
			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}

		},
		_onObjectIdentifierTitlePress: function(oEvent) {

			//Cross app nav
			var cValue = oEvent.getSource().getTitle();
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					shellHash: "zpmow-zmmb004&/MaterialInformation/MaterialInfoSet(Material='" + cValue + "',Plant='')"
				}
			}));

			var url = window.location.href.split("#")[0] + hash;
			window.open(url);
		},
		zebraPrint: function(address, list) {
			window.cordova.plugins.zbtprinter.printImage(list, address,
				function(success) {
					sap.m.MessageToast.show("Printing Inprocess...");
				},
				function(fail) {
					sap.m.MessageToast.show(fail);
				}
			);
		},
		zebraConnect: function() {

			var defer = $.Deferred();
			window.cordova.plugins.zbtprinter.discoverPrinters(
				function(MACAddress) {
					var addr = MACAddress;
					// that.zebraPrint(address,this.val);
					// this.address = MACAddress;
					defer.resolve(addr);
				}.bind(this),
				function(fail) {
					sap.m.MessageToast.show(fail);
					defer.reject();
				}.bind(this)
			);

			return defer;

		},
		base64Barcode: function(text) {
			var canvas = document.createElement("canvas");
			JsBarcode(canvas, text, {
				format: "CODE39"
			});
			var dataURL = canvas.toDataURL("image/png");
			return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
		},
		_printZebra: function(printData) {
			var printList = [];
			for (var i = 0; i < printData.length; i++) {
				var label = printData[i]["label"];
				var printQty = printData[i]["printQty"];
				var barcode = this.base64Barcode(label);
				for (var j = 0; j < printQty; j++) {
					printList.push(barcode);
				}
				if (this.address == "") {
					var defer = this.zebraConnect();
					$.when.apply($, [defer]).done(function(arg) {
						this.zebraPrint(arg, printList);
						this.address = arg;
					}.bind(this)).fail(function(arg) {

					});
				} else {
					this.zebraPrint(this.address, printList);
				}
				// base64.push();
				// window.cordova.plugins.zbtprinter.printImage(base64, this.address,
				// 	function(success) {
				// 		alert("Print ok");
				// 	},
				// 	function(fail) {
				// 		alert(fail);
				// 	}
				// );

			}

		},
		_onPageNavButtonPress: function() {

			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var oQueryParams = this.getQueryParameters(window.location);

			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("default", true);
			}
		},
		getQueryParameters: function(oLocation) {

			var oQuery = {};
			var aParams = oLocation.search.substring(1).split("&");
			for (var i = 0; i < aParams.length; i++) {
				var aPair = aParams[i].split("=");
				oQuery[aPair[0]] = decodeURIComponent(aPair[1]);
			}
			return oQuery;

		},
		_onButtonPress: function(oEvent) {

			var sDialogName = "Dialog1";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "iam.swish.GenQrBarcode.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
					oDialog.getParent().getController().addCallBack(function(fnCallBack) {
						if (fnCallBack == "OK") {
							//do print

							var oTable = this.getView().byId("stable");

							// var aData = (oTable.getItems() || []).map(function(oItem) {
							// 	// assuming that you are using the default model  
							// 	return oItem.getBindingContext().getObject();
							// });
							var printData = [];
							for (var i = 0; i < oTable.getItems().length; i++) {
								var item = oTable.getItems()[i];
								var matID = item.getCells()[0].getTitle();
								var printQty = item.getCells()[1].getValue();
								var batch = item.getCells()[3].getText();
								printData.push({
									label: matID + batch,
									printQty: printQty
								});
							}
							var deviceData = this.getView().getModel("device").getData();

							//check device if not phone or tablet , do nothing
							if (deviceData.system.tablet || deviceData.system.phone) {
								this._printZebra(printData);
							}
							// this._printZebra(printData);

						} else {
							//dont print
						}
					}.bind(this));
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("ListMatForGen").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);