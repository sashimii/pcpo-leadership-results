let fs = require('fs'),
   PDFParser = require("pdf2json");

let pdfParser = new PDFParser(this,1);

const pdfNumber = 3;

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
pdfParser.on("pdfParser_dataReady", pdfData => {

 const cleanedDataPromise = () => {
    return new Promise((resolve, reject) => {
      // Page: Array<Text>
      // Pages: Array<Page>
      const parseRawText = (rawText) => {
        return rawText &&
               rawText.R &&
               rawText.R[0] &&
               rawText.R[0].T
               ? decodeURIComponent(rawText.R[0].T) :
                '';
      }
      const isCandidate = (textChunk) => {
        return textChunk === 'ELLIOTT, Christine' ||
               textChunk === 'MULRONEY, Caroline' ||
               textChunk === 'FORD, Doug' ||
               textChunk === 'ALLEN, Tanya Granic'
      }

      const isRiding = (textChunk) => {
        return !isCandidate(textChunk) && isNaN(parseInt(textChunk));
      }

      const isVoteCount = (arr, i) => {

        return isCandidate(parseRawText(arr[i-1]));
      }

      const isVotePercent = (arr, i) => {
        return isVoteCount(arr, i-1);
      }

      const isObjectFull = (result) => {
        // console.log(typeof result['Riding'], typeof result['Candidate'], typeof result['Ballots'], typeof result['Electoral Votes'])
        const isFull = typeof result['Riding'] === 'string' &&
               typeof result['Candidate'] === 'string' &&
               typeof result['Ballots'] === 'number' &&
               typeof result['Electoral Votes'] === 'number';
        return isFull;
      }

      let cleanData = [];
      let results = [];

      const dataModel = {
        "Riding": null,
        "Candidate": null,
        "Ballots": null,
        "Electoral Votes": null
      }
      let ridingResults = {
        "Riding": null,
        "Candidate": null,
        "Ballots": null,
        "Electoral Votes": null
      }
      // let results = [];
      let currentRiding = '';

      pdfData.formImage.Pages.forEach((page) => {


        page.Texts.forEach((rawText, index, array) => {
          const text = parseRawText(rawText);
          if(isRiding(text)) {
            // console.log('RIDING: ', text);
            currentRiding = text;
            ridingResults['Riding'] = currentRiding;
          } else if (isCandidate(text)) {
            // console.log('CANDIDATE: ', text);
            ridingResults['Candidate'] = text;
          } else if (isVoteCount(array, index)) {
            // console.log('BALLOTS', text);
            ridingResults['Ballots'] = Number(text);
          } else if (isVotePercent(array, index)) {
            // console.log('ELECTORAL VOTES: ',text);
            ridingResults['Electoral Votes'] = Number(text)
          }

          if(ridingResults['Candidate'] === 'ALLEN, Tanya Granic') {
            console.log(ridingResults);
          }
          if(isObjectFull(ridingResults)) {
            // console.log(ridingResults);
            results.push(ridingResults);
            ridingResults = {
              "Riding": currentRiding,
              "Candidate": null,
              "Ballots": null,
              "Electoral Votes": null
            }
          }
        });
        // console.log(results);
      });
      // console.log(results);
      resolve(results);
    });
  }

 cleanedDataPromise().then((list)=>{
   // console.log(list);
   fs.writeFile(`./Results_Round_${pdfNumber}.json`, JSON.stringify(list, null, 2));
 })
 // fs.writeFile("./content.json", JSON.stringify(pdfData));
});

pdfParser.loadPDF(`./PC_Leadership_Results_Summary_File_${pdfNumber}.pdf`);
