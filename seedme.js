const rn = require('random-number');
const LoremIpsum = require('lorem-ipsum').LoremIpsum;
const generar_etiquetas = require('./utils');

function seedme(howmuch = 5){
    var array_me = [];

    const lorem = new LoremIpsum({
        sentencesPerParagraph: {
            max: 8,
            min: 4
          },
          wordsPerSentence: {
            max: 16,
            min: 4
          }
    });
    var random = rn.generator({min: 0, max: 18, integer: true});
    for( var i = 0; i < howmuch; i++){
        var catg = random();
        var anos = random(0, 5);
        var jorn = random(0, 3);
        var cont = random(0, 3);
        array_me.push({
            id: array_me.length,
            title: lorem.generateWords(4), 
            description: lorem.generateParagraphs(2),
            category: catg,
            exp_years: anos,
            duration: jorn,
            contract: cont,
            author: -1,
            date: new Date().toDateString(),
            tags: generar_etiquetas([catg, anos, jorn, cont])
        });
    }
    return array_me;
}

module.exports = seedme;