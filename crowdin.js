module.exports.download = function(projectName, apiKey, destFolder) {
	destFolder = destFolder || '.';

	var crowdinApi = require('crowdin-api');
	var https = require('https');
	var jsZip = require("jszip");
	var fs = require('fs');

	crowdinApi.setKey(apiKey);
	crowdinApi.exportTranslations(projectName)
		.then(function(exportResp) {
			console.dir(exportResp);

			var exportStatus = exportResp['success']['status'];

			if (exportStatus == 'built' || exportStatus == 'skipped') {
				var downloadUrl = "https://api.crowdin.com/api/project/" + projectName + "/download/all.zip?key=" + apiKey;

				var req = https.get(downloadUrl, function (res) {
					if (res.statusCode !== 200) return;
					var data = [], dataLen = 0;

					res.on("data", function (chunk) {
						data.push(chunk);
						dataLen += chunk.length;
					});

					res.on("end", function () {
						var buf = new Buffer(dataLen);
						for (var i = 0,len = data.length, pos = 0; i < len; i++) {
							data[i].copy(buf, pos);
							pos += data[i].length;
						}

						var zip = new jsZip(buf);
						var files = zip.files;
						for (var i in files) {
							if (!files[i].dir) {
								var fileName = destFolder + "/i18n-" + files[i].name.split('/')[0] + ".js";
								var text = zip.file(files[i].name).asText();
								var po2json = require('./po2json');
								po2json(text, fileName);
							}
						}
					});
				});
			} else {
				console.error("Can't export translations");
			}
		})
		.catch(function (error) {
			console.log(error);
			process.exit(2);
		});
};

module.exports.extract = function(projectName, apiKey, marker, files, destFolder) {
  var extract = require('./extract');
	var crowdinApi = require('crowdin-api');
	var https = require('https');
	var fs = require('fs');
	var po2json = require('./po2json');
	extract("keys.pot", marker, files, function() {
		console.log("Keys extracted into keys.pot");
		fs.readFile("keys.pot", "utf-8", function read(err, text) {
			if (err) {
					throw err;
			}
			var req = https.request({
					hostname: 'api.crowdin.com',
					port: 443,
					path: "/api/project/" + projectName + "/info?json=true&key=" + apiKey,
					method: 'POST'
				}, function (res) {
					res.setEncoding('utf8');
					res.on('data', (d) => {
						var langs = JSON.parse(d).languages;
						langs.forEach(function(lang){
							var fileName = destFolder + "/i18n-" + lang.code + ".js";
							po2json(text, fileName);
						})
					});
			});
			req.end();
		});
	});
}

module.exports.upload = function(projectName, apiKey, marker, files) {
	var extract = require('./extract');
	var crowdinApi = require('crowdin-api');

	var potFile = "keys.pot";

	extract(potFile, marker, files, function() {
		crowdinApi.setKey(apiKey);
		crowdinApi.updateFile(projectName, [ potFile ]).then(function(uploadResp) {
			console.log(uploadResp);
		});
	});
};

module.exports.add = function(projectName, apiKey, marker, files) {
	var extract = require('./extract');
	var crowdinApi = require('crowdin-api');

	var potFile = "keys.pot";
	extract(potFile, marker, files, function() {
		crowdinApi.setKey(apiKey);
		crowdinApi.addFile(projectName, [ potFile ]).then(function(uploadResp) {
			console.log(uploadResp);
		});
	});
};
