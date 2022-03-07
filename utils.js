const {categorias, anos_exp, jornada, contrato}  = require('./criterios.js');

function combinations(chars) {
    var result = [];
    var f = function(prefix, chars) {
      for (var i = 0; i < chars.length; i++) {
        result.push(prefix + chars[i]);
        f(prefix + chars[i] + ".", chars.slice(i + 1));
      }
    }
    f('', chars);
    return result;
  }

function permutation(array) {
    function p(array, temp) {
        var i, x;
        if (!array.length) {
            result.push(temp);
        }
        for (i = 0; i < array.length; i++) {
            x = array.splice(i, 1)[0];
            p(array, temp.concat(x));
            array.splice(i, 0, x);
        }
    }
    var result = [];
    p(array, []);
    return result;
}

function generar_etiquetas(array){
    if(array.length != 4){
        console.log("Argumentos insuficientes o sobrecarga de argumentos.");
    }
    else{ 
        var tag_catg = categorias.find(c => c.id == array[0]).tag;
        var tag_anoe = anos_exp.find(c => c.id == array[1]).tag;
        var tag_jorn = jornada.find(c => c.id == array[2]).tag;
        var tag_cont = contrato.find(c => c.id == array[3]).tag;
        var array_tags = [tag_catg, tag_anoe, tag_jorn, tag_cont];
        var setmeup = new Set();
        //permutation(array_tags).forEach((c) =>{
            combinations/*(c)*/(array_tags).forEach((o)=>{
                setmeup.add(o);
            });
        //});
        return setmeup;
    }
}

module.exports = generar_etiquetas;