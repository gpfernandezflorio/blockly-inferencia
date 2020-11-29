TIPOS = {i:0};

TIPOS.unificar = function(uno, otro) {
  if (otro.id == "VAR") {
    if (otro.v in Inferencia.mapa_de_variables) {
      let tipo_unificado = Inferencia.mapa_de_variables[otro.v].tipo;
      if (TIPOS.distintos(tipo_unificado, otro)) {
        return TIPOS.unificar(uno, tipo_unificado);
      }
      if (uno.id == "VAR") { return otro; }
    }
    return uno;
  }
  return uno.unificar(otro);
}

TIPOS.distintos = function(t1, t2) {
  if (t1.id != t2.id) {
    return true;
  }
  if (t1.id=="VAR") {
    return t1.v != t2.v;
  }
  return false;
}
// Retorna el índice de la próxima variable fresca
TIPOS.fresca = function() {
  TIPOS.i++;
  return TIPOS.i;
}


TIPOS.UNDEF = {
  id: "UNDEF",
  str: "indefinido"
}; // Todavía no está definido
TIPOS.VAR = function(v_id) { // Variable fresca
  if (v_id in Inferencia.mapa_de_variables) { return Inferencia.mapa_de_variables[v_id].tipo; }
  return {
    id:"VAR", str: "variable fresca " + TIPOS.fresca(),
    v:v_id,
    unificar: function(otro) { return otro; }
  };
}
TIPOS.LISTA = function(alfa) {
  return {id:"LISTA", str: "lista de " + alfa.str, alfa:alfa,
    unificar:function(otro) {
      if (otro.id == "LISTA") {
        let tipo_unificado = TIPOS.unificar(this.alfa, otro.alfa);
        if (tipo_unificado) {
          this.alfa = tipo_unificado;
        } else { return null; }
        return otro;
      }
      return null;
    }
  }
}; // Lista
TIPOS.ENTERO = {id:"ENTERO", str: "entero",
  unificar:function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return otro;
    }
    return null;
  }
}; // Entero
TIPOS.FRACCION = {id:"FRACCION", str: "flotante",
  unificar:function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return this;
    }
    return null;
  }
}; // Fracción
TIPOS.BINARIO = {id:"BINARIO", str: "booleano",
  unificar:function(otro) {
    if (otro.id == "BINARIO") {
      return this;
    }
    return null;
  }
}; // Binario
TIPOS.TEXTO = {id:"TEXTO", str: "string",
  unificar:function(otro) {
    if (otro.id == "TEXTO") {
      return this;
    }
    return null;
  }
}; // Texto

Blockly.Blocks['math_number'].getBlockType = function() {
  if (String(this.getFieldValue('NUM')).includes(".")) {return TIPOS.FRACCION;}
  return TIPOS.ENTERO;
};
Blockly.Blocks['logic_boolean'].getBlockType = function() {
  return TIPOS.BINARIO;
}
Blockly.Blocks['text'].getBlockType = function() {
  return TIPOS.TEXTO;
}
Blockly.Blocks['variables_get'].getBlockType = function() {
  return TIPOS.VAR(Inferencia.obtenerIdVariableBloque(this));
}
Blockly.Blocks['lists_create_with'].getBlockType = function() {
  if (this.itemCount_ > 0) {
    let tipo = undefined;
    for (var i=0; i<this.itemCount_; i++) {
      let bloque = this.getInputTargetBlock("ADD"+i);
      if (bloque && bloque.getBlockType) {
        if (tipo) {
          let tipo_unificado = TIPOS.unificar(tipo, bloque.getBlockType());
          if (tipo_unificado) {
            tipo = tipo_unificado;
          }
        } else {
          tipo = bloque.getBlockType();
        }
      }
    }
    if (tipo) return TIPOS.LISTA(tipo);
  }
  return TIPOS.LISTA(TIPOS.VAR(this.id));
}

function obtener_bloques_ancestros(bloque) {
  var lista = [];
  var block = bloque;
  do {
    lista.push(block);
    block = block.getSurroundParent();
  } while (block);
  return lista;
}

const bloques_superiores = [
  "main", "procedures_defreturn", "procedures_defnoreturn",
  "ultrasonic_setup", "joystick_setup", "keypad_setup", "color_setup",
  "h_bridge_setup", "h_bridge_setup_pid", "stepper_setup", "lcd_setup",
  "spi_setup", "remote_setup", "remote_setup_custom",
  "event_period", "event_condition",
  "event_ultrasonic", "event_ldr_analog", "event_ldr", "event_pir",
  "event_joystick_axis_change", "event_joystick_axis_limit", "event_keypad",
  "event_remote","define_def"
]

function obtener_bloque_superior(bloque) {
  var ancestros = obtener_bloques_ancestros(bloque);
  for (var i=0; i<ancestros.length; i++) {
    // Me detengo en una definición, no en cualquier stack
    if (bloques_superiores.includes(ancestros[i].type)) {
      return ancestros[i];
    }
  }
  return null;
}

const Inferencia = {};
Main.generador = Blockly.JavaScript;

function mostrarMapa() {
  let res = "<h3>Resultado</h3><table id='t01'><tr><th>scope</th><th>variable</th><th>tipo inferido</th></tr>"
  for (v_id in Inferencia.mapa_de_variables) {
    let scope = Inferencia.mapa_de_variables[v_id].scope;
    if (scope) {
      scope =  scope.nombre_original + " ";
    } else {
      scope = " ";
    }
    res += "<tr><td>" + scope + "</td><td>" + Inferencia.mapa_de_variables[v_id].nombre_original + "</td><td>" + Inferencia.mapa_de_variables[v_id].tipo.str + "</td></tr>";
  }
  res += "</table>";
  document.getElementById("resultado").innerHTML = res;
}

// Inicia la ejecución
Main.ejecutar = function(){
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
  TIPOS.i=0;
  let bloques_top = ws.getTopBlocks(true);
  Inferencia.buscarGlobales(bloques_top);
  for (bloque of bloques_top) {
    Inferencia.definirVariablesDelMapa(bloque, obtenerScope(bloque));
  }
  Inferencia.unificarTipos();
};

// Reviso los bloques que definen variables globales y las agrego al scope GLOBAL
Inferencia.buscarGlobales = function(bloques) {
  for (bloque of bloques) {
    if (bloque.type == 'variables_global_def') {
      // ...
    }
  }
};

// Recorro un scope y agrego sus variables al mapa
Inferencia.definirVariablesDelMapa = function(top, scope) {
  for (bloque of todos_los_hijos(top)) {
    if (bloque.type == 'variables_set'/* || bloque.type == 'variables_get'*/) {
      let nombre_variable = bloque.getField('VAR').getText();
      if (es_local(nombre_variable)) {
        let id_variable = Inferencia.obtenerIdVariable(nombre_variable, scope);
        if (id_variable in Inferencia.mapa_de_variables) {
          Inferencia.mapa_de_variables[id_variable].asignaciones.push({bloque:bloque.id});
        } else {
          Inferencia.mapa_de_variables[id_variable] = {
            scope: scope,
            nombre_original: nombre_variable,
            asignaciones: [{bloque:bloque.id}],
            tipos_a_unificar: [],
            tipo: TIPOS.VAR(id_variable)
          };
        }
      }
    }
  }
};

// Me fijo si puedo unificar los diferentes tipos de una misma variable
Inferencia.unificarTipos = function() {
  let algo_cambio = true;
  while (algo_cambio) {
    algo_cambio = false;
    for (v_id in Inferencia.mapa_de_variables) {
      for (asignacion of Inferencia.mapa_de_variables[v_id].asignaciones) {
        let bloque = Main.workspace.getBlockById(asignacion.bloque).getInputTargetBlock("VALUE");
        if (bloque && bloque.getBlockType) {
          let tipo = bloque.getBlockType();
          if (!Inferencia.mapa_de_variables[v_id].tipos_a_unificar.includes(tipo)) {
            Inferencia.mapa_de_variables[v_id].tipos_a_unificar.push(tipo);
          }
        }
      }
      let tipo0 = Inferencia.mapa_de_variables[v_id].tipo;
      Inferencia.mgu(Inferencia.mapa_de_variables[v_id]);
      if (TIPOS.distintos(tipo0, Inferencia.mapa_de_variables[v_id].tipo)) {algo_cambio = true;}
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
    if (unificacion) {
      mapa.tipo = unificacion;
    }
  }
  mapa.tipos_a_unificar = [];
};

//Inferencia.detectarTipoBloque(bloque);
Inferencia.detectarTipoBloque = function(bloque){
  if (bloque.type == 'variables_set') {
    //
  }
};

function es_local() {
  return true;
};

function obtenerScope(bloque) {
  let top = obtener_bloque_superior(bloque);
  if (top && (top.type == 'procedures_defnoreturn' || top.type == 'procedures_defreturn')) {
    let nombre_procedimiento = top.getField('NAME').getText();
    return {
      id_s: Inferencia.obtenerIdVariable(nombre_procedimiento, null, "PROC"),
      nombre_original: nombre_procedimiento
    };
  }
  return {
    id_s: "MAIN",
    nombre_original: "procedimiento principal"
  };
}

function todos_los_hijos(bloque) {
  let res = [bloque];
  for (hijo of bloque.getChildren(true)) {
    res = res.concat(todos_los_hijos(hijo));
  }
  return res;
};

Inferencia.obtenerIdVariableBloque = function(bloque) { // el bloque debe ser variables_get o variables_set
  let nombre_original = bloque.getField("VAR").getText();
  return Inferencia.obtenerIdVariable(nombre_original, obtenerScope(bloque));
}
Inferencia.obtenerIdVariable = function(nombre_original, scope, prefijo="VAR") {
  if (scope) {
    scope = "_" + scope.id_s + "_"
  } else {
    scope = "_";
  }
  return prefijo + scope + nombre_original;
};
