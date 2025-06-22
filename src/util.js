// Utilites

import fs from 'fs';

export function chomp(line) {
	if(line.endsWith('\n')) line = line.slice(0, -1);
	if(line.endsWith('\r')) line = line.slice(0, -1);
	return line;
}

export function getFileNames() {
  // now process the files starting with "page"
  var fileNames = fs.readdirSync('./src/').filter((word) => word.startsWith('page'));
  // Sort by extracting numbers from file names
  fileNames.sort((a, b) => {
	const numA = parseInt(a.match(/\d+/)[0], 10); // Extract and parse number from 'a'
	const numB = parseInt(b.match(/\d+/)[0], 10); // Extract and parse number from 'b'
	return numA - numB; // Compare numbers
  });
  return fileNames;
}

export function convertFromLatin(buffer) {
//	console.log('type of buffer='+typeof buffer);
	// convert to UTF 16
	let line = buffer.toString('latin1');
	// replace 92 with a 2032
	line=line.replace(/\x92/g,"'");  // 2019 or 2032
	line=line.replace(/\x9C/g,"\u0153");
	line=line.replace(/\x85/g,"\u2026");
	line=line.replace(/\x8C/g,"\u0152");
	for(var i=0; i<line.length; i++) {
		let num = line.charCodeAt(i);
		if((num>=128)&&(num<160)) {
			console.log('Warning: Illegal characrer found value='+num+'='+(num.toString(16))+'="'+line[i]+'"');
		}
	}
//	console.log('Input line=',line);
	return line;
}

const string1 = "Est-ce par peur qu’ils chantent dans le noir?";
console.log(convertFromLatin(string1));
