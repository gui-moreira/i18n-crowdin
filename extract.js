module.exports = function(potFile, marker, files, cbk) {
	potFile = potFile || 'keys.pot';
	marker = marker || 'i18n';
	files = files || '**/*.jsx';

	console.log("Extracting keys into [" + potFile + "] using marker [" + marker + "] from files [" + files + "]");

	var fs = require('fs');
	var glob = require('glob');

	var context = {};

	var regexp =  new RegExp(marker + "\\.tr(?:n)?\\('(.*?)'(?:(?:\\s+)?,(?:\\s+)?(?:'(.*?)'))?.*\\)", "g");

	var readFiles = 0;

	glob(files, function (err, files) {
		if (err) throw err;
		files.forEach(function(e, i, a) {
			fs.readFile(e, 'utf8', function (err, data) {
				if (err) throw err;
				var myArray;
				while ((myArray = regexp.exec(data)) !== null) {
					var txt = myArray[1];

					if (context[txt]) {
						context[txt].files.push(e);
					} else {
						var props = { "files": [ e ] };
						if (myArray[2]) {
							props.plural = myArray[2];
						}
						context[txt] = props;
					}
				}

				readFiles++;

				// All files read, create POT file
				if (readFiles == files.length) {
					if (Object.keys(context).length == 0) {
						throw new Error("No keys found - using marker [" + marker + "] in files = " + files);
					}

					// POT header
					var builder = [];

					Object.keys(context).forEach(function(k) {
						context[k].files.forEach(function(v) {
							builder.push('#: ' + v);
						});

						builder.push('msgid ' + JSON.stringify(k));

						if (context[k].plural) {
							builder.push('msgid_plural ' + JSON.stringify(context[k].plural));
							builder.push('msgstr[0] ""');
							builder.push('msgstr[1] ""\n');
						} else {
							builder.push('msgstr ""\n');
						}
					});

					fs.writeFile(potFile, builder.join('\n'), function(err) {
						if (err) throw err;
						console.log(potFile + ' saved, executing callback function');
						cbk();
					});
				}
			});
		});
	});
};
