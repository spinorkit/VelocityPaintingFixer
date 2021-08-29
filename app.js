'use strict';

const fs = require('fs');
const path = require('path');

const readlines = require('n-readlines');
var os = require("os");

var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);

const kYMin = 100;
const targetSpeed = 'F1500.00';
const maxNormalExtrudeSpeed = 3000;

try {
   const filename = myArgs[0];
   const lines = new readlines(filename);

   const pathParts = path.parse(filename);
   pathParts.name += '-fixed';
   pathParts.name += pathParts.ext;

   const outputPath = path.join(pathParts.dir,pathParts.name);
   console.log('outputPath=',outputPath);

   const output = fs.createWriteStream(outputPath);

   let line;
   let lineNumber = 0;

   const kInit = 'init';
   const kLastComment = 'lastComment';
   const kLastE0 = 'lastE0';
   const kLastAdded = 'lastAdded';
   
   let state = kInit;

   let write = false;
   let stripFeedRate = false;
   let isAdded = false;
   let isOuterPeri = false;
   let isExtrude = false;
   let isComment = false;
   let featureIsOuterPeri = false;
   let isZ = false;
   let isTargetSpeed = false;
   let isE0 = false;

   let prevLine = '';
   let outputPrevLine = false;
   let y = 0;
   let lastY = 0;
   let feedRate = 0;
   let lineStr = '';
   let correctSideY = false;
   let wantDrawn = false;
   let lastWantDrawn = false;
   let lastWasTargetSpeed = false;
   let lastWrittenWasE0 = false;

   while (line = lines.next()) {
      write = true;
      
      isAdded = line.includes('; added');
      if(line.includes('; feature')) {
         isOuterPeri = line.includes('; feature outer perimeter');
      }

      lineStr = line.toString('ascii');
      const yPos = lineStr.indexOf(' Y');
      y = parseFloat(lineStr.substr(yPos+2));

      correctSideY = y > kYMin && lastY > kYMin;

      wantDrawn = isOuterPeri && correctSideY;
      isComment = line[0]===';';
      isZ = line.includes('G1 Z');
      isExtrude = !isComment && line.includes(' E');
      isE0 = line.includes('E0.0000');

      if(isExtrude) {
         const fPos = lineStr.indexOf(' F');
         if(fPos >= 0) {
            feedRate =  parseFloat(lineStr.substr(fPos+2));
         }
      }
      isTargetSpeed = line.includes(targetSpeed);
      stripFeedRate = (!isZ && (isTargetSpeed || (isExtrude && feedRate > maxNormalExtrudeSpeed)) && !isAdded); 


   //   if(isAdded)
   //      console.log('isAdded ', isAdded);

   switch(state) {
      case kInit:
         break;
      case kLastComment:
      case kLastE0:
         stripFeedRate = false;
         break;
      case kLastAdded:
         if(!isAdded && !lastWantDrawn) {
            stripFeedRate = !(lastWasTargetSpeed && isOuterPeri);
            if(!lastWrittenWasE0) {
               //srtip feedrate
               const endPos = prevLine.indexOf(' F');
               if(endPos > 0) {
                  output.write(prevLine.substr(0, endPos));
                  output.write('\r');
               }
            } else {
               output.write(prevLine);
            }
         output.write('\n');
         }
      break;
   }


   if(!isAdded || wantDrawn) {
      if(stripFeedRate) {
         const endPos = line.indexOf(' F');
         if(endPos > 0) {
            output.write(line.subarray(0, endPos));
            output.write('\r');
         } else
         output.write(line);
      } else {
         output.write(line);
      }
      output.write('\n');
      lastWrittenWasE0 = isE0;
   }

   if(isComment)
      state = kLastComment;
   else if(isE0)
      state = kLastE0;
   else if(isAdded) 
      state = kLastAdded;
   else
      state = kInit;

   //line.copy(prevLine);
   prevLine = lineStr;
   lastWantDrawn = wantDrawn;
   lastY = y;
   lastWasTargetSpeed = isTargetSpeed;

      //console.log('Line ' + lineNumber + ': ' + line.toString('ascii'));
      //if(line.includes('; added')) {
         //output.write(line);
         //console.log('Line ' + lineNumber + ': ' + line);
      //}
      lineNumber++;
   }

console.log('Lines ' + lineNumber);
output.end();

} catch (err) {
   console.error(err)
}
