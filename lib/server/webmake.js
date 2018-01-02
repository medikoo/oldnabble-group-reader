"use strict";

const resolve   = require("path").resolve
    , pluck     = require("es5-ext/lib/Function/pluck")
    , partial   = require("es5-ext/lib/Function/prototype/partial")
    , compact   = require("es5-ext/lib/Object/compact")
    , count     = require("es5-ext/lib/Object/count")
    , every     = require("es5-ext/lib/Object/every")
    , map       = require("es5-ext/lib/Object/map")
    , promisify = require("deferred").promisify
    , writeFile = promisify(require("fs").writeFile)
    , webmake   = require("webmake")
    , config    = require("../../config");

const isArray = Array.isArray, stringify = JSON.stringify, root = resolve(__dirname, "../../");

let data, build, inProgress;

module.exports = function self(save) {
	if (save && inProgress) {
		if (inProgress !== true) {
			inProgress(partial.call(self, true));
			inProgress = true;
		}
		return null;
	}

	const copy = compact(
		map(data, function self(value, key) {
			if (isArray(value)) {
				return every(value, pluck("read"))
					? null
					: value.map(
							function (art) {
								const obj = {};
								this.forEach(name => {
									obj[name] = art[name];
								});
								return obj;
							},
							[
								"author",
								"date",
								"description",
								"guid",
								"headTitle",
								"link",
								"read",
								"skipAuthor",
								"skipTitle",
								"title"
							]
						);
			} else if (value) {
				value = compact(map(value, self));
				return count(value) ? value : null;
			}
			return false;
		})
	);

	return inProgress = webmake(resolve(root, "lib/client/public/main.js"))(content => {
		const index = content.indexOf("%RSS%");
		content =
			content.slice(0, index) +
			stringify(
				stringify(copy)
					.replace(/\u2028/g, "\\u2028")
					.replace(/\u2029/g, "\\u2029")
			).slice(1, -1) +
			content.slice(index + 5);
		content = content.replace(
			"%GROUPNAME%",
			config.group.replace("\\", "\\\\").replace("'", "\\'")
		);
		if (save) {
			return writeFile(resolve(root, "public/j/main.js"), content)(() => {
				console.log("Client application updated");
				inProgress = false;
			});
		}
		inProgress = false;

		return content;
	});
};

data = require("./data");
