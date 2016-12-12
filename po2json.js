module.exports = function(text, jsFile) {
	var singularRegex = new RegExp('msgid "(.*?)"\nmsgstr "(.*?)"\n', 'g');
	var pluralRegex = new RegExp('msgid "(.*?)"\nmsgid_plural "(.*?)"\nmsgstr\\[0\\] "(.*?)"\nmsgstr\\[1\\] "(.*?)"\n', 'g');

	var translations = {};

	var myArray;
	text = text.replace(/\\"/g, '"').replace(/\\\\/g,'\\');
	while ((myArray = singularRegex.exec(text)) !== null) {
		translations[myArray[1]] = myArray[2];
	}

	while ((myArray = pluralRegex.exec(text)) !== null) {
		translations[myArray[1]] = myArray[3];
		translations[myArray[2]] = myArray[4];
	}

	var content = "const i18nMap = " + JSON.stringify(translations, null, '  ') + ";\nexport { i18nMap as default };";

	require('fs').writeFile(jsFile, content, function(err) {
		if (err) throw err;
		console.log(jsFile + ' saved!');
	});
};
