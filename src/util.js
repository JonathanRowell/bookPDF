// Utilites

import fs from 'fs';

const romanHash = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};
const s = "MCMLXXXIX";
// s = 1989
function romanToInt(str) {
	let accumulator = 0;
	const s = str.toUpperCase();
	for (let i = 0; i < s.length; i++) {
		if (s[i] === "I" && s[i + 1] === "V") {
		  accumulator += 4;
		  i++;
		} else if (s[i] === "I" && s[i + 1] === "X") {
		  accumulator += 9;
		  i++;
		} else if (s[i] === "X" && s[i + 1] === "L") {
		  accumulator += 40;
		  i++;
		} else if (s[i] === "X" && s[i + 1] === "C") {
		  accumulator += 90;
		  i++;
		} else if (s[i] === "C" && s[i + 1] === "D") {
		  accumulator += 400;
		  i++;
		} else if (s[i] === "C" && s[i + 1] === "M") {
		  accumulator += 900;
		  i++;
		} else {
		if(!romanHash[s[i]]) { return -1; } 
		  accumulator += romanHash[s[i]];
		}
  }
  return accumulator;
}

export function chomp(line) {
	if(line.endsWith('\n')) line = line.slice(0, -1);
	if(line.endsWith('\r')) line = line.slice(0, -1);
	return line;
}

export function getForwordNames() {
  // now process the files starting with "page_i.txt"
  let regex = /^([ivxlcdm]+)\.txt/;
  var fileNames = fs.readdirSync('./data/').filter((word) => regex.test(word));
  console.log(fileNames);
  // Sort by extracting numbers from file names
  fileNames.sort((a, b) => {
	const numA = romanToInt(a.match(regex)[0]); // Extract and parse number from 'a'
	const numB = romanToInt(b.match(regex)[0]); // Extract and parse number from 'b'
	return numA - numB; // Compare numbers
  });
  return fileNames;
}

export function getFileNames() {
  // now process the files starting with "page"
  var fileNames = fs.readdirSync('./data/').filter((word) => word.startsWith('page'));
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
console.log(getForwordNames());
