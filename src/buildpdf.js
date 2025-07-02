// PDF from PrintFile
// Written by Jonathan on 25 June 2025

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { chomp } from './util.js';
import { toHex } from './util.js';
import nReadlines from 'n-readlines';
import { encode } from 'windows-1252';

const FS = '\x1C';
const GS = '\x1D';
const RS = '\x1E';
const US = '\x1F';
const STX = '\x02';

// This program uses the data from the print file to produce a PDF file
// FS + filename (just for comments)
// US plus page number as text
// GS plus JSON of lineData
// The line ends with CR LF and the text is UFT8.
// A blank line in the print file is a blank line in the PDF file
// STX A new page (PDF addPage) is a STX alone on the line
// RS plus JSON for a table

// Font sizes  (better in a config file)
const small  =  6;
const normal = 10;
const large  = 14;
const gigantic = 20;

// Attributes to be used and modified
const docAttributes = {
	pdfVersion: '1.7',
    size: [432,648],
//	encoding: 'utf8',
    margins:{top: 43,
			 bottom: 56,
			 left: 56,
			 right: 56
	},
    info: {
        Title: 'Réflexions',
        Author: 'Susanne Rowell',
        Subject: 'Modern Poems'
    },
    autoFirstPage: false,
    bufferPages: true,
};

var errCount=0;

function decodeJSON(line) {
	try	{
		return JSON.parse(line);
	} catch(err) {
		console.log(line);
		console.log(err);
		errCount++;
	}
}

function translate(str) {
	return Buffer.from(str).toString('utf8');

/* 	const encodedStr = encode(str);
	return encodedStr;
 */}

function setFonts(doc) {
/* 	doc.registerFont('Garamond-Regular', './fonts/EBGaramond-Regular.ttf');
	doc.registerFont('Garamond-Bold',    './fonts/EBGaramond-Bold.ttf');
	doc.registerFont('Garamond-Italic',  './fonts/EBGaramond-Italic.ttf');
 */
	setFontAndSize(doc,'n');
}

function setFontAndSize(doc,code) {
	switch(code) {
		case 'n' : doc.font('./fonts/EBGaramond-Regular.ttf'); doc.fontSize(normal); break;
		case 'b' : doc.font('./fonts/EBGaramond-Bold.ttf'); doc.fontSize(normal); break;
		case 'i' : doc.font('./fonts/EBGaramond-Italic.ttf'); doc.fontSize(normal); break;
		case 'l' : doc.font('./fonts/EBGaramond-Regular.ttf'); doc.fontSize(large); break;
		case 's' : doc.font('./fonts/EBGaramond-Regular.ttf'); doc.fontSize(small); break;
		case 'g' : doc.font('./fonts/EBGaramond-Regular.ttf'); doc.fontSize(gigantic); break;
		default : 
			console.log('Invalid font name/size "'+code+'"');
			errCount++;
			setFontAndSize(doc,'n');
	}
}

function printPageNumber(doc,pageNumberTxt) {
	const OneCM = 28.3464;
	// This bit from https://github.com/foliojs/pdfkit/issues/1240
	let posn = Math.round(doc.page.pageHeight-OneCM-doc._fontSize/2);
	setFontAndSize(doc,'n');
	doc.text(pageNumberTxt, doc.page.width/2, doc.page.height - doc.page.margins.bottom, {lineBreak: false, align: 'center'});
}

function doPrintLine(doc,lineArray) {
	// an array of one or more bits of text for one line
	if(lineArray.length===1) {
		// only one line of text
		let item = lineArray[0];
		setFontAndSize(doc,item[0]);
		doc.text(translate(item[1]),item[2]);
	} else {
		// more than one item, calculate the width of text (wot)
		let isCentered = false;
		let wot = lineArray.reduce(function(acc,item) {
			// if one is centered, then the result should be centered
			if(item[2].centered) { isCentered=true; }
			console.log(item[1]);
			console.log(toHex(item[1]));
			console.log(toHex(translate(item[1])));
			setFontAndSize(doc,item[0]);
			return acc+doc.widthOfString(translate(item[1]));
		},0);
		// calculate position to render text, if centered
		let pos = docAttributes.margins.left;
		if(isCentered) {
			// Left position = 
			pos = doc.page.width/2-wot/2;
		}
		// now print the different fonts
		lineArray.forEach(function(item,index) {
			setFontAndSize(doc,item[0]);
			let itemText = translate(item[1]);
			if(index===lineArray.length-1) {
				// last item, allow move down
				doc.text(itemText);
			} else {
				if(index===0) {
					doc.text(itemText,{indent:pos,continued:true});
				} else {
					doc.text(itemText,{continued:true});
				}
			}
		});
	}
}		

function openPrintFile(doc) {
	// Open the print file and read a line at a time
	var reader = new nReadlines(path.join('./tmp','printfile.txt'));
	var lineNumber = 0;
	var fileOK = true;
	do {
		var buff = reader.next();
		if(!buff) {
			if(!fileOK) { errFiles++; }
			// end of the file
			break;
		}
		let line = chomp(buff.toString());
		lineNumber++;
		if(line.length===0) { 
			// put a blank line in the PDF file
			doc.moveDown();
			continue;
		}
		// switch on the first character
		switch(line[0]) {
		case FS : // Just a file name for a comment
			console.log('Doing file '+line.slice(1));
			break;
		case US : // pageNumber in text form
			printPageNumber(doc,line.slice(1));
			break;
		case STX : // new page
			doc.addPage();
			break;
		case RS : // A JSON table
			let usJson = decodeJSON(line.slice(1));
			if(usJson.options) {
				/*jshint -W083 */
				usJson.options.prepareRow = (row, i) => setFontAndSize(doc,'n');
			} else {
				/*jshint -W083 */
				usJson.options = {prepareRow: (row, i) => setFontAndSize(doc,'n')};
			}
			setFontAndSize(doc,'n');
			doc.table(usJson);
			break;
		case GS : //Print line
			let gsJson = decodeJSON(line.slice(1));
			doPrintLine(doc,gsJson);
			break;
		default : // illegal starting character
			console.log('Illegal character at line '+ lineNumber);
			errCount++;
		}
	} while(true);
	// here to finish
	console.log('Finishing the doc');
	if(docAttributes.bufferPages) {
		console.log('Flushing pages');
		doc.flushPages();
	}
	console.log('Ending the document');
	doc.end();
}

// See: https://stackoverflow.com/questions/13156243/event-associated-with-fs-createwritestream-in-node-js
// See also : https://stackoverflow.com/questions/12906694/fs-createwritestream-does-not-immediately-create-file
function setUpWriter(doc,openPrintFile,finishFunc) {
	let writer = fs.createWriteStream("./pdf/reflexions.pdf",{ highWaterMark: 250000 });
	doc.pipe(writer);
	// setup the finish event
	writer.on("finish", finishFunc);
	// handle the error event
	writer.on("error", function (err) {
		errCount++;
		console.log('Error occurred on writing to file pdf/reflexions.pdf');
		console.log(err);
		finishFunc();
	});
	writer.on('open',function() {
		setFonts(doc);
		openPrintFile(doc);
		console.log('Closing the writer');
		writer.end(function() {
			console.log('Callback writer.end()');
		});
	});
	return writer;
}

function finishFunc() {
	if(errCount>0) {
		console.log(errCount + ' Errors found');
		process.exit(1);
	} else {
		console.log('No errors found');
		process.exit(0);
	}
}

function createPDFFile() {
	const doc = new PDFDocument(docAttributes);
	setUpWriter(doc,openPrintFile,finishFunc);
}

createPDFFile();
