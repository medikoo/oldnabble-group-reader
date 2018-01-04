"use strict";

const forEach = require("es5-ext/object/for-each")
    , data    = require("./data");

const { isArray } = Array
    , socket = io.connect(`${ location.protocol }//${ location.host }`)
    , path = [];

forEach(data, function processItem(value, itemName) {
	path.push(itemName);
	if (isArray(value)) {
		value.$path = Array.from(path);
		value.forEach(article => {
			article.on("update", e => {
				if (e && e.type === "read") {
					socket.emit("read", value.$path.concat(article.guid));
				}
			});
		});

		value.on("ignore", () => {
			socket.emit("ignore", value.$path);
		});
	} else {
		forEach(value, processItem);
	}
	path.pop();
});
