Main.mostrarMapa = function() {
  let res = `<h4>${Blockly.Msg.TIPOS_RESULTADO}</h4>`;
  const variables_main = [];
  const variables_locales = [];
  const variables_globales = [];
  const funciones = [];
  for (v_id in Inferencia.mapa_de_variables) {
    let mapa = Inferencia.mapa_de_variables[v_id];
    let scope = mapa.scope;
    if (scope.id_s=="GLOBAL") {
      if (v_id.startsWith("VAR")) {variables_globales.push(mapa);}
      else {funciones.push(mapa);}
    } else if (scope.id_s.startsWith("MAIN")) {
      variables_main.push(mapa);
    } else {
      variables_locales.push(mapa);
    }
  }
  if (variables_main.length > 0 || variables_locales.length > 0) {
    res += `<h5>${Blockly.Msg.TIPOS_VARIABLES_LOCALES}</h5>`;
    res += `<table id='t01'><tr><th>${Blockly.Msg.TIPOS_SCOPE}</th><th>${Blockly.Msg.TIPOS_VARIABLE}</th><th>${Blockly.Msg.TIPOS_TIPO_INFERIDO}</th></tr>`;
    for (mapa of variables_main.concat(variables_locales)) {
      let scope = mapa.scope;
      if (scope) {
        scope =  scope.nombre_original + " ";
      } else {
        scope = " ";
      }
      res += "<tr><td>" + scope + "</td><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  if (variables_globales.length) {
    res += `<h5>${Blockly.Msg.TIPOS_VARIABLES_GLOBALES}</h5>`
    res += `<table id='t01'><tr><th>${Blockly.Msg.TIPOS_VARIABLE}</th><th>${Blockly.Msg.TIPOS_TIPO_INFERIDO}</th></tr>`;
    for (mapa of variables_globales) {
      res += "<tr><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  if (funciones.length) {
    res += `<h5>${Blockly.Msg.TIPOS_FUNCIONES}</h5>`
    res += `<table id='t01'><tr><th>${Blockly.Msg.TIPOS_FUNCION}</th><th>${Blockly.Msg.TIPOS_TIPO_INFERIDO}</th></tr>`;
    for (mapa of funciones) {
      res += "<tr><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  document.getElementById("resultado").innerHTML = res;
};

// Inicia la ejecución
Main.ejecutar = function() {
  if (!Main.procesando) {
    Main.procesando = true;
    setTimeout(function() {
      delete Main.procesando;
      Errores.recolectarErroresYAdvertencias(Main.workspace);
      Inferencia.crearMapaDeVariables(Main.workspace);
      Main.mostrarMapa();
      //const codigo = Main.generador.workspaceToCode(Main.workspace);
      //console.log(codigo);
      Errores.quitarErroresYAdvertenciasObsoletos(Main.workspace);
    }, 200); // La interfaz tarda un poco en actualizarse
  }
};


Main.completarInterfaz = function() {
  let opcionesIdiomas = '';
  for (i of Main.argumentosValidos.idioma) {
    opcionesIdiomas += '<option' + (i==Main.idioma ? ' selected' : '') +'>';
    opcionesIdiomas += `${Blockly.Msg["TIPOS_IDIOMA_"+i.toUpperCase()]}</option>`
  }
  document.getElementById("boton_abrir").innerHTML = Blockly.Msg.TIPOS_ABRIR;
  document.getElementById("boton_guardar").innerHTML = Blockly.Msg.TIPOS_GUARDAR;
  document.getElementById("boton_testear").innerHTML = Blockly.Msg.TIPOS_TESTEAR;
  document.getElementById("opciones").innerHTML = `<h4>${Blockly.Msg.TIPOS_OPCIONES}</h4>` +
  '<table>' +
    `<tr><td>${Blockly.Msg.TIPOS_IDIOMA}</td><td><select id="opcion_idiomas" onchange="Main.opcion_idiomas();">` +
      opcionesIdiomas +
    '</select></td></tr>' +
    `<tr><td>${Blockly.Msg.TIPOS_VARIABLES}</td><td><select id="opcion_variables" onchange="Main.opcion_variables();">` +
      `<option>${Blockly.Msg.TIPOS_SOLO_LOCALES}</option>` +
      `<option>${Blockly.Msg.TIPOS_SOLO_GLOBALES}</option>` +
      `<option>${Blockly.Msg.TIPOS_AMBAS}</option>` +
    '</select></td></tr>\
  </table>';
};

const bloques_superiores = [
  "main", "procedures_defreturn", "procedures_defnoreturn", "variables_global_def"
];
