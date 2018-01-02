"use strict";

const pluck   = require("es5-ext/function/pluck")
    , not     = require("es5-ext/function/#/not")
    , count   = require("es5-ext/object/count")
    , forEach = require("es5-ext/object/for-each")
    , map     = require("es5-ext/object/map")
    , ee      = require("event-emitter");

const { isArray } = Array;

const markRead = function () {
	if (!this.read) {
		this.read = true;
		this.emit("update", { type: "read" });
	}
};

const data = JSON.parse("%RSS%");

console.log("DATA", data);

module.exports = exports = map(data, function myself(itemData, itemName) {
	if (isArray(itemData)) {
		itemData = ee(itemData);
		itemData.forEach(article => {
			ee(article);
			article.on("update", () => {
				itemData.emit("update");
			});
			article.markRead = markRead;
		});
		itemData.on("ignore", () => {
			delete exports[itemName];
		});
		itemData.on("update", function () {
			if (!this.filter(not.call(pluck("read"))).length) {
				delete exports[itemName];
			}
		});
	} else {
		itemData = ee(map(itemData, myself));
		forEach(itemData, (obj, objName) => {
			if (isArray(obj)) {
				obj.on("update", function () {
					if (!this.filter(not.call(pluck("read"))).length) {
						delete itemData[objName];
						itemData.emit("update");
					}
				});
				obj.on("ignore", () => {
					delete itemData[objName];
					itemData.emit("update");
				});
			} else {
				obj.on("update", function () {
					if (!count(this)) {
						delete itemData[objName];
						itemData.emit("update");
					}
				});
			}
		});
	}
	return itemData;
});

forEach(exports, (obj, objName) => {
	obj.on("update", function () {
		if (!count(this)) {
			delete exports[objName];
		}
	});
});
