// Module to control formatting
// Written by Jonathan on 15 June 2025

// Booksize 6x9 = https://www.blurb.com/book-dimensions?srsltid=AfmBOoow5BJjx2eaZ20WBslKGUoIQQdoD6aCubXutbJCbI-wz6YFCtz2
// formatting constants in <>
// b=bold, i=italic, u=underlined, g=gigantic, l=large, s=small
const lineDirectives = [ 'b','i','u','g','s','l'];
const pageDirectives = ['center'];

const splitRegex = /(<[^<>]*>)/;

	
function isValidDirective(directive) {
	let x = lineDirectives.findIndex((entry) => entry===directive)!==-1;
	console.log(x);
	return x;
}

function extractDirectives(line) {
	// This function MUST NOT be called with an empty string
//	console.log('extractDirectives ',line);
	let i=0; let last=0;
	let ret = line.split(splitRegex);
	// validate the directives
	if(ret[0].length===0) { ret.shift(); }
	if(ret[ret.length-1].length===0) { ret.pop(); }
	console.log(ret);
	return ret;
}
	
function validOpening(entry) {
	// directive - check type "opening"
	return (entry[0]==='<')&&(entry.length===3)&&(entry[2]==='>')&&(isValidDirective(entry[1]));
}
	
function validClosing(entry,code) {
	// directive - check type "closing"
	return (entry[0]==='<')&&(entry.length===4)&&(entry[3]==='>')&&(entry[2]===code)&&(entry[1]==='/');
}
	
export function generateText(line,how,attrs) {
	let dirArray = extractDirectives(line);
//	console.log(dirArray);
	// This function does not allow embedded directives, like <b><i>.......
	let i = 0;
	let sections = [];
	while(i<dirArray.length) {
		let item = dirArray[i];
		if(validOpening(item)) {
			if(((i+2)<dirArray.length)&&(validClosing(dirArray[i+2],item[1]))) {
//				let myObj = {}; myObj[item[1]] = dirArray[i+1];
				sections.push([item[1],dirArray[i+1],attrs]);
			} else {
				// invalid sequence
				console.log('invalid sequence at '+i);
				return null;
			}
			i=i+3;
		} else {
			if(item.startsWith('<')) { 
				 // invalid opening or closing
				console.log('invalid open/close at '+i);
				return null;
			}
			sections.push([how,dirArray[i],attrs]);	// text node
			i++;
		}
	}
	return sections;
}

// test
const string1 = 'this simple the<b>html string</b> text test that<b>need</b>to<b>spl</b>it it too';
const string2 = 'This is in <b>bold</b>, <i>italic</i> and the ends normally';
const string3 = '<b>bold</b>';
const string4 = 'The quick brown fox jumped over the lazy dog';
//console.log(extractDirectives(string1));
//console.log(extractDirectives(string2));
//console.log(extractDirectives(string3));
//console.log(extractDirectives(string4));

/*
console.log(generateText(string1,'n',{}));
console.log(generateText(string2,'n',{}));
console.log(generateText(string3,'n',{}));
console.log(generateText(string4,'n',{}));
//console.log(generateText('\r\n','n',{}));
 
//console.log(extractDirectives(string1));
console.log(generateText('<l>REMERCIEMENT</l>no','n',{}));
*/
