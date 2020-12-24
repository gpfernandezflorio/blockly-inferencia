function obtener_bloques_ancestros(bloque) {
  var lista = [];
  while (bloque) {
    lista.push(bloque);
    bloque = bloque.getSurroundParent();
  }
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
  "event_remote","define_def", "variables_global_def"
];

function obtener_bloque_superior(bloque, nombre) {
  var ancestros = obtener_bloques_ancestros(bloque);
  for (ancestro of ancestros) {
    // Me detengo en una definición
    if (bloques_superiores.includes(ancestro.type)) {
      return ancestro;
    }
    // También si llego al ciclo en el que declaré la variable en cuestión
    if (['controls_for','controls_forEach'].includes(ancestro.type) && ancestro.getField("VAR").getText()==nombre) {
      return ancestro;
    }
  }
  return null;
};

const Inferencia = {};

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
    } else if (scope.id_s.startsWith("MAIN")) {
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
Main.ejecutar = function() {
  if (!Main.procesando) {
    Main.procesando = true;
    setTimeout(function() {
      delete Main.procesando;
      Main.recolectarErrores();
      Inferencia.crearMapaDeVariables(Main.workspace);
      mostrarMapa();
      //const codigo = Main.generador.workspaceToCode(Main.workspace);
      //console.log(codigo);
      Main.quitarErroresObsoletos();
    }, 200);
  }
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
  let bloques_top = ws.getTopBlocks(true).filter(function(x) {return bloques_superiores.includes(x.type)});
  Inferencia.buscarGlobales(bloques_top);
  for (bloque of bloques_top) {
    Inferencia.definirVariablesDelMapa(bloque);
  }
  Inferencia.ejecutar();
};

// Reviso los bloques que definen variables globales y las agrego al scope GLOBAL
Inferencia.buscarGlobales = function(bloques) {
  for (bloque of bloques) {
    if (bloque.variableLibre) {
      bloque.variableLibre(true);
    }
  }
};

// Recorro un scope y agrego sus variables al mapa
Inferencia.definirVariablesDelMapa = function(top) {
  for (bloque of todos_los_hijos(top)) {
    if (bloque.variableLibre) {
      bloque.variableLibre(false);
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
    if (!(id_variable in Inferencia.mapa_de_variables)) {
      Inferencia.mapa_de_variables[id_variable] = {
        scope: scope,
        nombre_original: nombre,
        tipo: TIPOS.VAR(id_variable)
      };
    }
    return Inferencia.mapa_de_variables[id_variable];
  }
  return undefined;
};

Inferencia.existeVariableGlobal = function(nombre) {
  let id_variable = Inferencia.obtenerIdVariable(nombre, Inferencia.scopeGlobal(), "VAR");
  return id_variable in Inferencia.mapa_de_variables;
};

// Algoritmo de inferencia
Inferencia.ejecutar = function() {
  for (bloque of Main.workspace.getAllBlocks()) {
    if (bloque.tipado) {
      bloque.tipado();
    }
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

function numeroDeCiclo(bloque) {
  let i=0;
  let tope = bloque.getSurroundParent();
  let ancestro = bloque;
  while (ancestro && ancestro != tope) {
    if (['controls_for','controls_forEach'].includes(ancestro.type)) { i++; }
    ancestro = ancestro.getParent();
  }
  return i;
}

function obtenerScope(bloque, nombre) {
  if (Main.modo_variables == "GLOBALES") {
    return Inferencia.scopeGlobal();
  } else if (Main.modo_variables == "AMBAS") {
    if (Inferencia.existeVariableGlobal(nombre)) {
      return Inferencia.scopeGlobal();
    }
  }
  let top = obtener_bloque_superior(bloque, nombre);
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
    } else if (['controls_for','controls_forEach'].includes(top.type)) {
      // scope especial: dentro de un ciclo
      let scope2 = obtenerScope(top.getSurroundParent(), nombre);
      if (scope2 && scope2.id_s != "GLOBAL") {
        return {
          id_s: scope2.id_s + " - " + top.id,
          nombre_original: scope2.nombre_original + " - ciclo " + numeroDeCiclo(top)
        }
      }
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
Inferencia.obtenerIdVariableBloque = function(bloque) { // el bloque debe tener un field "VAR" (variables_get, variables_set, controls_for, controls_forEach)
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
