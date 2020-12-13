function obtener_bloques_ancestros(bloque) {
  var lista = [];
  var block = bloque;
  do {
    lista.push(block);
    block = block.getSurroundParent();
  } while (block);
  return lista;
};

const bloques_superiores = [
  "main", "procedures_defreturn", "procedures_defnoreturn",
  "ultrasonic_setup", "joystick_setup", "keypad_setup", "color_setup",
  "h_bridge_setup", "h_bridge_setup_pid", "stepper_setup", "lcd_setup",
  "spi_setup", "remote_setup", "remote_setup_custom",
  "event_period", "event_condition",
  "event_ultrasonic", "event_ldr_analog", "event_ldr", "event_pir",
  "event_joystick_axis_change", "event_joystick_axis_limit", "event_keypad",
  "event_remote","define_def"
];

function obtener_bloque_superior(bloque) {
  var ancestros = obtener_bloques_ancestros(bloque);
  for (var i=0; i<ancestros.length; i++) {
    // Me detengo en una definición, no en cualquier stack
    if (bloques_superiores.includes(ancestros[i].type)) {
      return ancestros[i];
    }
  }
  return null;
};

const Inferencia = {};
Main.generador = Blockly.JavaScript;

Blockly.defineBlocksWithJsonArray([  // BEGIN JSON EXTRACT
  {
    "type": "main",
    "message0": "MAIN",
    "args0": [],
    "message1": "%1",
    "style": "procedure_blocks",
    "args1": [{"type":"input_statement","name":"LOOP"}],
    "inputsInline": false
  }
]);  // END JSON EXTRACT (Do not delete this comment.)

Main.generador['main'] = function(block) {
  var mainBranch = Main.generador.statementToCode(block, 'LOOP');
  return mainBranch;
};

function mostrarMapa() {
  let res = "<h4>Resultado</h4>";
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
    } else if (scope.id_s=="MAIN") {
      variables_main.push(mapa);
    } else {
      variables_locales.push(mapa);
    }
  }
  if (variables_main.length || variables_locales.length) {
    res += "<h5>Variables locales</h5>"
    res += "<table id='t01'><tr><th>scope</th><th>variable</th><th>tipo inferido</th></tr>";
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
    res += "<h5>Variables globales</h5>"
    res += "<table id='t01'><tr><th>variable</th><th>tipo inferido</th></tr>";
    for (mapa of variables_globales) {
      res += "<tr><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  if (funciones.length) {
    res += "<h5>Funciones</h5>"
    res += "<table id='t01'><tr><th>función</th><th>tipo inferido</th></tr>";
    for (mapa of funciones) {
      res += "<tr><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  document.getElementById("resultado").innerHTML = res;
}

// Inicia la ejecución
Main.ejecutar = function(){
  Main.quitarErrores();
  Inferencia.crearMapaDeVariables(Main.workspace);
  mostrarMapa();
  //const codigo = Main.generador.workspaceToCode(Main.workspace);
  //console.log(codigo);
}

// Reviso todos los bloques para recolectar variables en sus respectivos scopes
// Luego le asigno un tipo a cada una (de ser posible)
Inferencia.crearMapaDeVariables = function(ws) {
  // Mapa: por cada scope, todas las variables definidas.
  // Por cada una de ellas, una lista de los bloques que la usan y el tipo que le asignan
  Inferencia.mapa_de_variables = {};
  // Mapa secundario para bloques sin tipo definido
  Inferencia.variables_auxiliares = {};
  TIPOS.i=0;
  let bloques_top = ws.getTopBlocks(true);
  Inferencia.buscarGlobales(bloques_top);
  for (bloque of bloques_top) {
    Inferencia.definirVariablesDelMapa(bloque);
  }
  Inferencia.unificarTipos();
};

// Reviso los bloques que definen variables globales y las agrego al scope GLOBAL
Inferencia.buscarGlobales = function(bloques) {
  for (bloque of bloques) {
    if (bloque.type == 'variables_set'/*'variables_global_def'*/ && Main.modo_variables != "LOCALES") {
      let nombre = bloque.getField('VAR').getText();
      Inferencia.agregarVariableAlMapa(nombre, bloque, "VAR", true);
    } else if (bloque.type == 'procedures_defreturn') {
      let nombre = bloque.getFieldValue('NAME');
      Inferencia.agregarVariableAlMapa(nombre, bloque, "PROC", true);
    }
  }
};

// Recorro un scope y agrego sus variables al mapa
Inferencia.definirVariablesDelMapa = function(top) {
  for (bloque of todos_los_hijos(top)) {
    if (bloque.type == 'variables_set') {
      let nombre = bloque.getField('VAR').getText();
      Inferencia.agregarVariableAlMapa(nombre, bloque, "VAR", false);
    }
  }
};

Inferencia.agregarVariableAlMapa = function(nombre, bloque, clase, global) {
  let scope;
  if (global) {
    scope = Inferencia.scopeGlobal();
  } else {
    scope = obtenerScope(bloque, nombre);
  }
  if (scope) {
    let id_variable = Inferencia.obtenerIdVariable(nombre, scope, clase);
    if (id_variable in Inferencia.mapa_de_variables) {
      Inferencia.mapa_de_variables[id_variable].asignaciones.push({bloque:bloque.id});
    } else {
      Inferencia.mapa_de_variables[id_variable] = {
        scope: scope,
        nombre_original: nombre,
        asignaciones: [{bloque:bloque.id}],
        tipos_a_unificar: [],
        tipo: TIPOS.VAR(id_variable)
      };
    }
  }
}

Inferencia.existeVariableGlobal = function(nombre) {
  let id_variable = Inferencia.obtenerIdVariable(nombre, Inferencia.scopeGlobal(), "VAR");
  return id_variable in Inferencia.mapa_de_variables;
}

// Me fijo si puedo unificar los diferentes tipos de una misma variable
Inferencia.unificarTipos = function() {
  let algo_cambio = true;
  while (algo_cambio) {
    algo_cambio = false;
    for (v_id in Inferencia.mapa_de_variables) {
      let mapa = Inferencia.mapa_de_variables[v_id];
      for (asignacion of mapa.asignaciones) {
        let bloque = Main.workspace.getBlockById(asignacion.bloque);
        if (bloque && bloque.type == 'variables_set') {
          bloque = bloque.getInputTargetBlock("VALUE");
        } else if (bloque && bloque.type == 'procedures_defreturn') {
          bloque = bloque.getInputTargetBlock("RETURN");
        }
        if (bloque && bloque.tipo) {
          let tipo = bloque.tipo();
          if (!mapa.tipos_a_unificar.includes(tipo)) {
            mapa.tipos_a_unificar.push(tipo);
          }
        }
      }
      let tipo0 = mapa.tipo;
      if (tipo0.alfa && tipo0.alfa.alfa) {
        const x = 0;
      }
      Inferencia.mgu(mapa);
      if (TIPOS.distintos(tipo0, mapa.tipo)) {algo_cambio = true;}
    }
    for (v_id in Inferencia.mapa_de_variables) {
      let tipo0 = Inferencia.mapa_de_variables[v_id].tipo;
      Inferencia.mgu(Inferencia.mapa_de_variables[v_id]);
      if (TIPOS.distintos(tipo0, Inferencia.mapa_de_variables[v_id].tipo)) {algo_cambio = true;}
    }
  }
};

Inferencia.mgu = function(mapa) {
  for (tipo of mapa.tipos_a_unificar) {
    let unificacion = TIPOS.unificar(mapa.tipo, tipo);
    mapa.tipo = unificacion;
  }
  mapa.tipos_a_unificar = [];
};

//Inferencia.detectarTipoBloque(bloque);
Inferencia.detectarTipoBloque = function(bloque){
  if (bloque.type == 'variables_set') {
    //
  }
};

function es_local(bloque) {
  if (Main.modo_variables == "LOCALES") {
    return true;
  } else if (Main.modo_variables == "GLOBALES") {
    return false;
  }
  let nombre_variable = bloque.getField('VAR').getText();
  return !Inferencia.existeVariableGlobal(nombre_variable);
};

function obtenerScope(bloque, nombre) {
  if (Main.modo_variables == "GLOBALES") {
    return Inferencia.scopeGlobal();
  } else if (Main.modo_variables == "AMBAS") {
    if (Inferencia.existeVariableGlobal(nombre)) {
      return Inferencia.scopeGlobal();
    }
  }
  let top = obtener_bloque_superior(bloque);
  if (top) {
    if (top.type == 'procedures_defnoreturn' || top.type == 'procedures_defreturn') {
      let nombre_procedimiento = top.getField('NAME').getText();
      return {
        id_s: Inferencia.obtenerIdVariable(nombre_procedimiento, null, "PROC"),
        nombre_original: nombre_procedimiento
      };
    } else if (top.type == "main") {
      return {
        id_s: "MAIN",
        nombre_original: "procedimiento principal"
      };
    }
  }
  if (Main.modo_variables != "LOCALES") { return Inferencia.scopeGlobal(); }
  return null;
}

Inferencia.scopeGlobal = function() {
  return {
    id_s: "GLOBAL",
    nombre_original: "global"
  };
}

function todos_los_hijos(bloque) {
  let res = [bloque];
  for (hijo of bloque.getChildren(true)) {
    res = res.concat(todos_los_hijos(hijo));
  }
  return res;
};

Inferencia.obtenerIdFuncionBloque = function(bloque) { // el bloque debe ser procedures_callreturn
  let nombre_original = bloque.getFieldValue('NAME');
  return Inferencia.obtenerIdVariable(nombre_original, Inferencia.scopeGlobal(), "PROC");
}
Inferencia.obtenerIdVariableBloque = function(bloque) { // el bloque debe ser variables_get o variables_set
  let nombre_original = bloque.getField("VAR").getText();
  let scope = obtenerScope(bloque, nombre_original);
  if (scope) return Inferencia.obtenerIdVariable(nombre_original, scope, "VAR");
  return null;
}
Inferencia.obtenerIdVariable = function(nombre_original, scope, prefijo) {
  if (scope) {
    scope = "_" + scope.id_s + "_"
  } else {
    scope = "_";
  }
  return prefijo + scope + nombre_original;
};
