sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"./JsBarcode",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MessageBox, Utilities, Barcode, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("iam.swish.GenQrBarcode.controller.GenByMatNo", {
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
		callSearchDialog: function() {
			var oView = this.getView();
			var sDialogName = "Dialog5";
			// var po = this.getView().getModel("po").getProperty("/PO");
			var oDialog = oView.byId("dialog5");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "iam.swish.GenQrBarcode.view." + sDialogName, this.getView().getController());
				oView.addDependent(oDialog);
			}
			oDialog.open();
		},
		dialogClose: function(evt) {
			this.getView().byId("dialog5").close();
		},
		dialogOK: function(evt) {
			var item = this.getView().byId('searchTable').getSelectedItem();
			var matno = item.getBindingContext().getObject().Matnr;
			this.getView().byId("matno").setValue(matno);
			this.getView().byId("matno").fireChange();
			this.getView().byId("dialog5").close();
		},
		address: "",
		zebraPrint: function(address, value, qty) {
			var base64 = new Array();
			for (var i = 0; i < qty; i++) {
				base64.push(value);
			}
			window.cordova.plugins.zbtprinter.printImage(base64, address,
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
		onSearch: function(evt) {
			var oTable = this.getView().byId("searchTable");
			var binding = oTable.getBinding("items");
			var matno = this.getView().byId("dmatno").getValue();
			var matdesc = this.getView().byId("dmatdesc").getValue();
			var sloc = this.getView().byId("dsloc").getValue();
			var plant = this.getView().byId("dplant").getValue();
			var batch = this.getView().byId("dbatch").getValue();
			var filters = [];
			if (matno) {
				filters.push(new Filter("Matnr", FilterOperator.Contains, matno));
			}
			if (matdesc) {
				filters.push(new Filter("Maktx", FilterOperator.Contains, matdesc));
			}
			if (sloc) {
				filters.push(new Filter("Lgort", FilterOperator.Contains, sloc));
			}
			if (plant) {
				filters.push(new Filter("Werks", FilterOperator.Contains, plant));
			}
			if (batch) {
				filters.push(new Filter("Charg", FilterOperator.Contains, batch));
			}
			binding.filter(filters, sap.ui.model.FilterType.Application);
		},
		onInputChange: function(evt) {

			var url = this.getView().getModel().sServiceUrl;
			var oModel = new sap.ui.model.odata.ODataModel(url, true);
			var oJsonModel = new sap.ui.model.json.JSONModel();
			var value = evt.getSource().getValue();
			oModel.read("/MaterialInfoSet(Matnr='" + value + "',Charg='')", null, null, true, function(oData, repsonse) {
				var oObjH = this.getView().byId("ObjHeader");
				var notfound = false;
				oObjH.setBackgroundDesign("Translucent");
				if (oData.Maktx == 'NOTFOUND') {
					oData.Matnr = oData.Matnr;
					oData.Maktx = "Material Number not found.";
					notfound = true;
					oObjH.setNumberState("Error");
				} else {
					oObjH.setNumberState("Success");
				}
				oJsonModel.setData(oData);
				oObjH.setModel(oJsonModel);
				//Set BarCode Image
				if (!notfound) {
					var url = this.getView().getModel().sServiceUrl;
					var img = url + "/IdentityLabelSet(MaterialNumber='" + oData.Matnr + "',BatchNumber='')/$value";
					var oImg = this.getView().byId("img");
					oImg.setSrc(img);

				} else {

					var oImg = this.getView().byId("img");
					oImg.setSrc("");
				}

				// oObjH.bindElement(oJsonModel);
			}.bind(this));
			// sap.ui.getCore().setModel(oJsonModel);

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
		_onInputValueHelpRequest: function(oEvent) {

			var sDialogName = "Dialog5";
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
		_onButtonPress: function(oEvent) {

			var sDialogName = "Dialog4";
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
							var matno = this.getView().byId("matno").getValue();
							var qty = this.getView().byId("prtqty").getValue();
							if (this.getView().byId("ObjHeader").getNumberState() == 'Error') {
								sap.m.MessageToast.show("Material not Found");
							} else {
								// alert("OK");
								// var c = document.createElement('canvas');
								// var imgId = this.getView().byId('img');
								// var img = document.getElementById(imgId.sId);
								// c.height = img.naturalHeight/2;
								// c.width = img.naturalWidth/2;
								// var ctx = c.getContext('2d');

								// ctx.drawImage(img, 0, 0, c.width, c.height, 0, 0, c.width, c.height);
								// var base64String = c.toDataURL("image/png");
								// var xstring = base64String.replace(/^data:image\/(png|jpg);base64,/, "");

								// // this.zebraPrint(base64String);
								// if(this.address == ""){
								// var defer = this.zebraConnect();
								// $.when.apply( $, [defer] ).done(function(arg){
								// 	this.zebraPrint(arg,xstring);
								// 	this.address = arg;
								// }.bind(this)).fail(function(arg){

								// });

								// }
								// else{
								// 	this.zebraPrint(this.address,xstring);
								// }
								// // if (address) {
								// // 	this.zebraPrint(address, xstring);
								// // }
								var canvas = document.createElement("canvas");
								JsBarcode(canvas, matno, {
									format: "CODE39"
								});
								var dataURL = canvas.toDataURL("image/png");
								var deviceData = this.getView().getModel("device").getData();

								var xstring = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
								if (this.deviceData.system.tablet || this.deviceData.system.phone) {
									if (this.address == "") {
										var defer = this.zebraConnect();
										$.when.apply($, [defer]).done(function(arg) {
											if (this.deviceData.system.tablet || this.deviceData.system.phone) {
												this.zebraPrint(arg, xstring, qty);
											}
											this.address = arg;
										}.bind(this)).fail(function(arg) {

										});

									} else {
										if (deviceData.system.tablet || deviceData.system.phone) {
											this.zebraPrint(this.address, xstring, qty);
										}
									}
								}
							}

							// var url = this.getView().getModel().sServiceUrl;
							// var img = url + "/IdentityLabelSet(MaterialNumber='" + matno + "',BatchNumber='')/$value";
							// var oImg = this.getView().byId("img");
							// oImg.setSrc(img);
							// debugger;

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
			this.oRouter.getTarget("GenByMatNo").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			// var oObjH = this.getView().byId("ObjHeader");
			// oObjH.setNumberState("None");
			// oObjH.setTitle("Material Not Found");

		}
	});
}, /* bExport= */ true);