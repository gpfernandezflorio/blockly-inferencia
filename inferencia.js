const Inferencia = {};

/** Contenido de infoEntorno:
  - bloquesSuperiores: lista de bloques superiores
  - error: función para notificar un error en un bloque
  - advertencia: función para notificar una advertencia en un bloque
  - modo_variables: función que retorne "LOCALES", "GLOBALES" o "AMBAS", según corresponda
**/
Inferencia.inicializar = function(infoEntorno) {
  Inferencia.bloquesSuperiores = infoEntorno.bloquesSuperiores;
  Inferencia.error = infoEntorno.error;
  Inferencia.advertencia = infoEntorno.advertencia;
  Inferencia.modo_variables = infoEntorno.modo_variables;
};

// Retorna el bloque que define el inicio del scope o null si no hay ninguno
Inferencia.topeScope = function(bloque, nombre) {
  let ancestro = bloque;
  while (ancestro) {
    // Me detengo en una definición
    if (Inferencia.bloquesSuperiores.includes(ancestro.type)) {
      return ancestro;
    }
    // También si llego al ciclo en el que declaré la variable en cuestión
    if (nombre && ['controls_for','controls_forEach'].includes(ancestro.type) && ancestro.getField("VAR").getText()==nombre) {
      return ancestro;
    }
    ancestro = ancestro.getSurroundParent();
  }
  return null;
};


// Reviso todos los bloques para recolectar variables en sus respectivos scopes
// Luego le asigno un tipo a cada una (de ser posible)
Inferencia.crearMapaDeVariables = function(ws) {
  // Mapa: por cada scope, todas las variables definidas.
  // Por cada una de ellas, una lista de los bloques que la usan y el tipo que le asignan
  Inferencia.mapa_de_variables = {};
  // Mapa secundario para bloques sin variables asociadas
  Inferencia.variables_auxiliares = {};
  TIPOS.init();
  let bloques_tope = Inferencia.obtenerBloquesSuperiores(ws);
  Inferencia.buscarGlobales(bloques_tope);
  Inferencia.definirVariablesDelMapa(bloques_tope);
  Inferencia.ejecutar(ws);
};

Inferencia.obtenerBloquesSuperiores = function(ws) {
  let bloquesValidos = []
  for (bloque of ws.getTopBlocks(true)) {
    if (Inferencia.bloquesSuperiores.includes(bloque.type)) {
      bloquesValidos.push(bloque);
    } else {
      Inferencia.error(bloque, "PARENT", "Este bloque tiene que estar dentro de otro");
    }
  }
  return bloquesValidos;
}

// Reviso los bloques que definen variables globales y las agrego al scope GLOBAL
Inferencia.buscarGlobales = function(bloques) {
  for (bloque of bloques) {
    if (bloque.variableLibre) {
      bloque.variableLibre(true);
    }
  }
};

// Recorro un scope y agrego sus variables al mapa
Inferencia.definirVariablesDelMapa = function(bloques_tope) {
  for (tope of bloques_tope) {
    for (bloque of Inferencia.todos_los_hijos(tope)) {
      if (bloque.variableLibre) {
        bloque.variableLibre(false);
      }
    }
  }
};

Inferencia.agregarVariableAlMapa = function(nombre, bloque, clase, global) {
  let scope;
  if (global) {
    scope = Inferencia.scopeGlobal();
  } else {
    scope = Inferencia.obtenerScope(bloque, nombre);
  }
  if (scope) {
    let id_variable = Inferencia.obtenerIdVariable(nombre, scope, clase);
    if (!(id_variable in Inferencia.mapa_de_variables)) {
      Inferencia.mapa_de_variables[id_variable] = {
        scope: scope,
        nombre_original: nombre,
        tipo: TIPOS.VAR(id_variable),
        otras_variables_que_unifican: [],
        bloques_dependientes: []
      };
    }
    return Inferencia.mapa_de_variables[id_variable];
  }
  return undefined;
};

Inferencia.asociarParDeVariables = function(v1, v2) {
  Inferencia.unificarVariableConVariable(v1, v2);
  Inferencia.unificarVariableConVariable(v2, v1);
};

Inferencia.unificarVariableConVariable = function(v, v2) {
  if (v.src == "V" && v.v in Inferencia.mapa_de_variables) {
    Inferencia.mapa_de_variables[v.v].otras_variables_que_unifican.push(v2);
  } else if (v.src == "B" && v.v in Inferencia.variables_auxiliares) {
    Inferencia.variables_auxiliares[v.v].otras_variables_que_unifican.push(v2);
  }
};

Inferencia.existeVariableGlobal = function(nombre) {
  let id_variable = Inferencia.obtenerIdVariable(nombre, Inferencia.scopeGlobal(), "VAR");
  return id_variable in Inferencia.mapa_de_variables;
};

Inferencia.esUnArgumento = function(nombre, bloque) {
  let tope = Inferencia.topeScope(bloque, nombre);
  if (tope && (tope.type == 'procedures_defnoreturn' || tope.type == 'procedures_defreturn') && tope.arguments_.includes(nombre)) {
    return tope;
  }
  return undefined;
};

// Algoritmo de inferencia
Inferencia.ejecutar = function(ws) {
  let todosLosBloques = [
    [], // primero los que no son llamadas
    []  // y por último las llamadas
  ];
  for (bloque of ws.getAllBlocks(true)) {
    if (bloque.type == 'procedures_callnoreturn' || bloque.type == 'procedures_callreturn') {
      todosLosBloques[1].push(bloque);
    } else {
      todosLosBloques[0].push(bloque);
    }
  }
  Inferencia.tipado(todosLosBloques);
};

Inferencia.tipado = function(todosLosBloques) {
  for (bloques of todosLosBloques) {
    for (bloque of bloques) {
      if (bloque.tipado) {
        bloque.tipado();
      }
    }
  }
};

Inferencia.numeroDeCiclo = function(bloque) {
  let i=0;
  let tope = bloque.getSurroundParent();
  let ancestro = bloque;
  while (ancestro && ancestro != tope) {
    if (['controls_for','controls_forEach'].includes(ancestro.type)) { i++; }
    ancestro = ancestro.getParent();
  }
  return i;
};

Inferencia.obtenerScope = function(bloque, nombre) {
  let tope = Inferencia.esUnArgumento(nombre, bloque);
  if (tope) {
    let nombre_procedimiento = tope.getField('NAME').getText();
    return {
      id_s: Inferencia.obtenerIdVariable(nombre_procedimiento, null, "PROC"),
      nombre_original: nombre_procedimiento
    };
  }
  if (Inferencia.modo_variables() == "GLOBALES") {
    return Inferencia.scopeGlobal();
  } else if (Inferencia.modo_variables() == "AMBAS") {
    if (Inferencia.existeVariableGlobal(nombre)) {
      return Inferencia.scopeGlobal();
    }
  }
  tope = Inferencia.topeScope(bloque, nombre);
  if (tope) {
    if (tope.type == 'procedures_defnoreturn' || tope.type == 'procedures_defreturn') {
      let nombre_procedimiento = tope.getField('NAME').getText();
      return {
        id_s: Inferencia.obtenerIdVariable(nombre_procedimiento, null, "PROC"),
        nombre_original: nombre_procedimiento
      };
    } else if (tope.type == "main") {
      return {
        id_s: "MAIN",
        nombre_original: "procedimiento principal"
      };
    } else if (['controls_for','controls_forEach'].includes(tope.type)) {
      // scope especial: dentro de un ciclo
      let scope2 = Inferencia.obtenerScope(tope.getSurroundParent(), nombre);
      if (scope2 && scope2.id_s != "GLOBAL") {
        return {
          id_s: scope2.id_s + " - " + tope.id,
          nombre_original: scope2.nombre_original + " - ciclo " + Inferencia.numeroDeCiclo(tope)
        }
      }
    }
  }
  if (Inferencia.modo_variables() != "LOCALES") { return Inferencia.scopeGlobal(); }
  return null;
};

Inferencia.scopeGlobal = function() {
  return {
    id_s: "GLOBAL",
    nombre_original: "global"
  };
};

Inferencia.todos_los_hijos = function(bloque) {
  let res = [bloque];
  for (hijo of bloque.getChildren(true)) {
    res = res.concat(Inferencia.todos_los_hijos(hijo));
  }
  return res;
};

Inferencia.obtenerIdFuncionBloque = function(bloque) { // el bloque debe ser procedures_callreturn
  let nombre_original = bloque.getFieldValue('NAME');
  return Inferencia.obtenerIdVariable(nombre_original, Inferencia.scopeGlobal(), "PROC");
};

Inferencia.obtenerIdVariableBloque = function(bloque) { // el bloque debe tener un field "VAR" (variables_get, variables_set, controls_for, controls_forEach)
  let nombre_original = bloque.getField("VAR").getText();
  let scope = Inferencia.obtenerScope(bloque, nombre_original);
  if (scope) return Inferencia.obtenerIdVariable(nombre_original, scope, "VAR");
  return null;
};

Inferencia.obtenerIdVariable = function(nombre_original, scope, prefijo) {
  if (scope) {
    scope = "_" + scope.id_s + "_"
  } else {
    scope = "_";
  }
  return prefijo + scope + nombre_original;
};
