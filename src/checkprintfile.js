// Check printfile
// Written by Jonathan on 24 June 2025

import fs from 'fs';
import path from 'path';
import { chomp } from './util.js';
import nReadlines from 'n-readlines';

const FS = '\x1C';
const GS = '\x1D';
const RS = '\x1E';
const US = '\x1F';
const STX = '\x02';

// This program tests the data file to produce a PDF file
// FS + filename (just for comments)
// US plus page number as text
// GS plus JSON of lineData
// The line ends with CR LF and the text is UFT8.
// A blank line in the print file is a blank line in the PDF file
// STX A new page (PDF addPage) is a STX alone on the line
// RS plus JSON for a table

var errCount = 0;

function assert(check,txt) {
	if(!check) {
		console.log('Error in line '+lineNumber+': '+txt);
		errCount++;
	}
}

function decodeJSON(line) {
	try	{
		return JSON.parse(line);
	} catch(err) {
		console.log(line);
		console.log(err);
		errCount++;
	}
}

// Open the print file and read a line at a time
var reader = new nReadlines(path.join('./tmp','printfile.txt'));
var lineNumber = 0;
var fileOK = true;
do {
	var buff = reader.next();
	if(!buff) {
		if(!fileOK) { errFiles++; }
		// end of this file
		break;
	}
	let line = chomp(buff.toString());
	lineNumber++;
	if(line.length===0) { break; }  // blank line in PDF file
	// switch on the first character
	switch(line[0]) {
		case FS : // Just a file name for a comment
			assert(line.length>1,"missing file name in comment");
			break;
		case US : // pageNumber in text form
			assert(line.length<2,"missing page number");
			break;
		case STX : // new page
//			console.log(Buffer.from(line).toString('hex'));
			assert(line.length===1,"New page text not needed "+line.length);
			break;
		case RS : // A JSON table
			let usJson = decodeJSON(line.slice(1));
			// assert something about a table
			break;
		case GS : //Print line
			let gsJson = decodeJSON(line.slice(1));
			// assert something about the JSON data
			break;
		default : // illegal starting character
			console.log('Illegal character at line '+ lineNumber);
			errCount++;
	}
} while(true);


if(errCount>0) {
	console.log(errCount + ' Errors found');
	process.exit(1);
} else {
	console.log('No errors found');
	process.exit(0);
}
