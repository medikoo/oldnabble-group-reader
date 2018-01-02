"use strict";

const pluck   = require("es5-ext/lib/Function/pluck")
    , not     = require("es5-ext/lib/Function/prototype/not")
    , count   = require("es5-ext/lib/Object/count")
    , forEach = require("es5-ext/lib/Object/for-each")
    , map     = require("es5-ext/lib/Object/map")
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

module.exports = exports = map(data, function self(itemData, name) {
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
			delete exports[name];
		});
		itemData.on("update", function () {
			if (!this.filter(not.call(pluck("read"))).length) {
				delete exports[name];
			}
		});
	} else {
		itemData = ee(map(itemData, self));
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

forEach(exports, (obj, name) => {
	obj.on("update", function () {
		if (!count(this)) {
			delete exports[name];
		}
	});
});
