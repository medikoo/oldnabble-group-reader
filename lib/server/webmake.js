"use strict";

const { resolve }   = require("path")
    , pluck         = require("es5-ext/function/pluck")
    , partial       = require("es5-ext/function/#/partial")
    , compact       = require("es5-ext/object/compact")
    , count         = require("es5-ext/object/count")
    , every         = require("es5-ext/object/every")
    , map           = require("es5-ext/object/map")
    , { promisify } = require("deferred")
    , writeFile     = promisify(require("fs").writeFile)
    , webmake       = require("webmake")
    , config        = require("../../config");

const { isArray } = Array, { stringify } = JSON, rootPath = resolve(__dirname, "../../");

let data = null, inProgress;

module.exports = function self(save) {
	if (save && inProgress) {
		if (inProgress !== true) {
			inProgress(partial.call(self, true));
			inProgress = true;
		}
		return null;
	}

	const copy = compact(
		map(data, function myself(value) {
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
				value = compact(map(value, myself));
				return count(value) ? value : null;
			}
			return false;
		})
	);

	return inProgress = webmake(resolve(rootPath, "lib/client/public/main.js"))(content => {
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
			return writeFile(resolve(rootPath, "public/j/main.js"), content)(() => {
				console.log("Client application updated");
				inProgress = false;
			});
		}
		inProgress = false;

		return content;
	});
};

data = require("./data");
