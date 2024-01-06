const Inferencia = {
  LOCALES: 0,
  GLOBALES: 1,
  AMBAS: 2
};

/** Contenido de infoEntorno:
  - todosLosBloques: función que dado un workspace devuelve la lista de bloques a recorrer
  - bloquesSuperiores: lista de bloques superiores
  - error: función para notificar un error en un bloque
  - advertencia: función para notificar una advertencia en un bloque
  - modo_variables: función que retorne "LOCALES", "GLOBALES" o "AMBAS", según corresponda
  - bloquesScopeAdicionales (opcional): función que determina el scope de una variable más allá de los scopes ya definidos
**/
Inferencia.inicializar = function(infoEntorno) {
  Inferencia.todosLosBloques = infoEntorno.todosLosBloques;
  Inferencia.bloquesSuperiores = infoEntorno.bloquesSuperiores;
  Inferencia.error = infoEntorno.error;
  Inferencia.advertencia = infoEntorno.advertencia;
  Inferencia.modo_variables = infoEntorno.modo_variables;
  Inferencia.bloquesScopeAdicionales = infoEntorno.bloquesScopeAdicionales;
  TIPOS.agregarBloqueVariableGlobal();
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
  TIPOS.init(ws);
  let bloques_tope = Inferencia.obtenerBloquesSuperiores(ws);
  Inferencia.buscarGlobales(bloques_tope, ws);
  Inferencia.definirVariablesDelMapa(bloques_tope);
  Inferencia.ejecutar(ws);
};

Inferencia.obtenerBloquesSuperiores = function(ws) {
  let bloquesValidos = []
  for (let bloque of ws.getTopBlocks(true).filter((x) => Inferencia.esBloqueUtil(x))) {
    if (Inferencia.bloquesSuperiores.includes(bloque.type)) {
      bloquesValidos.push(bloque);
    } else {
      Inferencia.advertencia(bloque, "PARENT", Blockly.Msg["TIPOS_ERROR_PARENT"]);
    }
  }
  return bloquesValidos;
}

// Reviso los bloques que definen variables globales y las agrego al scope GLOBAL
Inferencia.buscarGlobales = function(bloques, ws) {
  for (let bloque of bloques) {
    if (bloque.variableLibre) {
      bloque.variableLibre(true);
    }
  }
  // En caso de que se permitan los bloques de uso sin su definición asociada...
  for (let bloque of
        ws.getBlocksByType('procedures_callreturn').concat(
        ws.getBlocksByType('procedures_callnoreturn'))
    .filter((x) => Inferencia.esBloqueUtil(x))) {
    let nombre = bloque.getProcedureCall();
    TIPOS.obtenerArgumentosDefinicion(bloque, Inferencia.scopeProcedimiento(nombre));
    Inferencia.nuevaVariable(nombre, Inferencia.scopeGlobal(), "PROC");
  }
};

// Recorro un scope y agrego sus variables al mapa
Inferencia.definirVariablesDelMapa = function(bloques_tope) {
  for (let tope of bloques_tope) {
    for (let bloque of Inferencia.todos_los_hijos(tope)) {
      if (bloque.variableLibre) {
        bloque.variableLibre(false);
      }
    }
  }
};

// Para agregar un campo de un registro
Inferencia.agregarVariableCampoAlMapa = function(bloque, nombreRegistro, nombreCampo) {
  let t = Inferencia.agregarVariableAlMapa(nombreCampo, bloque, `REG_${nombreRegistro}`, true);
  if (t) {
    t.registro = nombreRegistro;
  }
  return t;
};

Inferencia.agregarVariableAlMapa = function(nombre, bloque_o_scope, clase, global) {
  let scope;
  if (bloque_o_scope.id_s) {
    scope = bloque_o_scope;
  } else {
    if (global) {
      scope = Inferencia.scopeGlobal();
    } else {
      scope = Inferencia.obtenerScope(bloque_o_scope, nombre);
    }
  }
  if (scope) {
    return Inferencia.nuevaVariable(nombre, scope, clase);
  }
  return undefined;
};

Inferencia.nuevaVariable = function(nombre, scope, clase) {
  let id_variable = Inferencia.obtenerIdVariable(nombre, scope, clase);
  let nuevaDefinicion;
  if (id_variable in Inferencia.mapa_de_variables) {
    nuevaDefinicion = Inferencia.mapa_de_variables[id_variable];
  } else {
    nuevaDefinicion = Inferencia.nuevaDefinicionVariable(scope, nombre, id_variable);
    Inferencia.mapa_de_variables[id_variable] = nuevaDefinicion;
  }
  return nuevaDefinicion;
};

Inferencia.nuevaDefinicionVariable = function(scope, nombre, tipo_o_id) {
  let tipo = typeof tipo_o_id == 'string' ? TIPOS.VAR(tipo_o_id) : tipo_o_id;
  return {
    scope: scope,
    nombre_original: nombre,
    tipo: tipo,
    otras_variables_que_unifican: [],
    bloques_dependientes: []
  };
};

Inferencia.nuevaDefinicionBloque = function(tipo) {
  return {
    tipo: tipo,
    otras_variables_que_unifican: [],
    bloques_dependientes: []
  };
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

Inferencia.esUnaVariableLocal = function(nombre, bloque) {
  let scope = Inferencia.obtenerScope(bloque, nombre);
  if (!scope) { return true; }
  return scope.id_s != "GLOBAL" && !Inferencia.esUnArgumento(nombre, bloque);
};

// Algoritmo de inferencia
Inferencia.ejecutar = function(ws) {
  // Esto tiene el problema de que si una asignación de variable tiene un llamado y otra
  // abajo no, se ejecuta primero la de abajo entonces queda el error en la de arriba.
  // Prefiero que quede así y que los bloques de más arriba definan primero, aunque haya
  // un llamado antes que una definición
  /*let todosLosBloques = [
    [], // primero las definiciones
    [], // después los que no son llamadas
    []  // y por último las llamadas
  ];
  for (let bloque of ws.getAllBlocks(true)) {
    if (Inferencia.contieneUnLlamado(bloque)) {
      todosLosBloques[2].push(bloque);
    } else if (bloque.type == 'procedures_defnoreturn' || bloque.type == 'procedures_defreturn') {
      todosLosBloques[0].push(bloque);
    } else {
      todosLosBloques[1].push(bloque);
    }
  }*/
  let todosLosBloques = Inferencia.todosLosBloques(ws).filter((x) => Inferencia.esBloqueUtil(x));
  /* Lo ejecuto dos veces para que la primera se resuelvan los tipos de
    las variables y la segunda se hagan las verificaciones de tipado con los
    tipos de las variables ya resueltos.
  */
  Inferencia.tipado(todosLosBloques);
  Inferencia.tipado(todosLosBloques);
};

/*Inferencia.contieneUnLlamado = function(bloque) {
  for (let hijo of Inferencia.todos_los_hijos(bloque)) {
    if (hijo.type == 'procedures_callnoreturn' || hijo.type == 'procedures_callreturn') {
      return true;
    }
  }
  return false;
};*/

Inferencia.tipado = function(todosLosBloques) {
  for (let bloque of todosLosBloques) {
    Inferencia.tipadoBloque(bloque);
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

Inferencia.scopeProcedimiento = function(nombre) {
  return {
    id_s: Inferencia.obtenerIdVariable(nombre, null, "PROC"),
    nombre_original: nombre
  };
}

Inferencia.obtenerScope = function(bloque, nombre) {
  let tope = Inferencia.esUnArgumento(nombre, bloque);
  if (tope) {
    let nombre_procedimiento = tope.getProcedureDef()[0];
    return Inferencia.scopeProcedimiento(nombre_procedimiento);
  }
  if (Inferencia.modo_variables() == Inferencia.GLOBALES) {
    return Inferencia.scopeGlobal();
  } else if (Inferencia.modo_variables() == Inferencia.AMBAS) {
    if (Inferencia.existeVariableGlobal(nombre)) {
      return Inferencia.scopeGlobal();
    }
  }
  tope = Inferencia.topeScope(bloque, nombre);
  if (tope) {
    if (tope.type == 'procedures_defnoreturn' || tope.type == 'procedures_defreturn') {
      let nombre_procedimiento = tope.getProcedureDef()[0];
      return Inferencia.scopeProcedimiento(nombre_procedimiento);
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
          nombre_original: scope2.nombre_original + ` - ${Blockly.Msg.TIPOS_CICLO} ` + Inferencia.numeroDeCiclo(tope),
          padre: scope2
        }
      }
    } else if (Inferencia.bloquesScopeAdicionales) { // Se podrían agregar otros bloques que generen scope (ej: eventos)
      let scopePrima = Inferencia.bloquesScopeAdicionales(bloque, nombre, tope);
      if (scopePrima) { return scopePrima; }
    }
  }
  if (Inferencia.modo_variables() != Inferencia.LOCALES) { return Inferencia.scopeGlobal(); }
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
  for (let hijo of bloque.getChildren(true)) {
    res = res.concat(Inferencia.todos_los_hijos(hijo));
  }
  return res.filter((x) => Inferencia.esBloqueUtil(x));
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

/*
  Invoca a la función de tipado del bloque dado. Genera errores y advertencias
    y realiza los chequeos adicionales.
*/
Inferencia.tipadoBloque = function(bloque) {
  let errorEnArgumentos = Inferencia.errorEnArgumentos(bloque);
  let tipado = undefined;
  if (
    bloque &&
    Inferencia.esBloqueUtil(bloque) &&
    bloque.tipado
  ) { // Necesito ejecutar tipadoExtra aunque haya errores en los argumentos
    tipado = bloque.tipado();
  }
  if (errorEnArgumentos) {
    return TIPOS.DIFERIDO(errorEnArgumentos);
  }
  return tipado;
};

/*
  Devuelve el tipo del bloque dado. Si puede, evita invocar a la función de
    tipado del bloque así que no necesariamente genera errores o advertencias
    ni realiza chequeos adicionales.
*/
Inferencia.tipo = function(bloque) {
  let errorEnArgumentos = Inferencia.errorEnArgumentos(bloque);
  if (errorEnArgumentos) {
    return TIPOS.DIFERIDO(errorEnArgumentos);
  }
  if (
    bloque &&
    Inferencia.esBloqueUtil(bloque)
  ) {
    if (bloque.type in TIPOS.tipoSalida) {
      let salida = TIPOS.tipoSalida[bloque.type];
      if (typeof salida == 'function') {
        let tipos_inputs = TIPOS.tiposEsperados.call(bloque);
        salida = salida.call(bloque, tipos_inputs);
      }
      return salida;
    } else if (bloque.tipado) {
      return bloque.tipado();
    }
  }
  return undefined;
};

/*
  Busca errores en los argumentos del bloque dado. Si encuentra alguno, lo
    devuelve. Si no, devuelve null.
*/
Inferencia.errorEnArgumentos = function(bloque) {
  if (bloque) {
    let tipos_inputs = TIPOS.tiposEsperados.call(bloque);
    for (let k in tipos_inputs) {
      if (TIPOS.fallo(tipos_inputs[k])) {
        return tipos_inputs[k];
      }
    }
  }
  return null;
};

Inferencia.esBloqueUtil = function(bloque) {
  return bloque.isEnabled() && !bloque.getInheritedDisabled() && !bloque.isDisposed();
};
