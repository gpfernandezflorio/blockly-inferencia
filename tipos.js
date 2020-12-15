TIPOS = {i:0};

TIPOS.obtenerTipoVariable = function(v) {
  if (v.src == "V" && v.v in Inferencia.mapa_de_variables) {
    return Inferencia.mapa_de_variables[v.v].tipo;
  }
  if (v.src == "B" && v.v in Inferencia.variables_auxiliares) {
    return Inferencia.variables_auxiliares[v.v].tipo;
  }
  return null;
};

TIPOS.redefinirTipoVariable = function(v, tipo) {
  if (v.src == "V" && v.v in Inferencia.mapa_de_variables) {
    Inferencia.mapa_de_variables[v.v].tipo = tipo;
  }
  if (v.src == "B" && v.v in Inferencia.variables_auxiliares) {
    Inferencia.variables_auxiliares[v.v].tipo = tipo;
  }
};

// FUNCIONES BÁSICAS DE TIPOS:
// unificar, distintos, colisionan, variablesEn, fallo

TIPOS.unificar = function(uno, otro) {
  if (TIPOS.fallo(uno) || TIPOS.fallo(otro)) {
    console.error("NO PUEDO UNIFICAR ERRORES");
  }
  if (TIPOS.distintos(uno, otro) && TIPOS.colisionan(uno, otro)) { return TIPOS.COLISION(uno, otro); }
  let resultado = uno;
  if (otro.id == "VAR") {
    let tipo_a_unificar = TIPOS.obtenerTipoVariable(otro);
    if (tipo_a_unificar) {
      if (TIPOS.distintos(tipo_a_unificar, otro)) {
        let tipo_unificado = TIPOS.unificar(uno, tipo_a_unificar);
        resultado = tipo_unificado;
      } else if (uno.id == "VAR" && uno.i > otro.i) {
        resultado = otro;
      }
      if (TIPOS.distintos(resultado, tipo_a_unificar)) {
        TIPOS.redefinirTipoVariable(otro, resultado);
      }
    }
  } else {
    resultado = uno.unificar(otro); // El "otro" NO es una variable
  }
  if (uno.id == "VAR" && TIPOS.distintos(resultado, uno)) {
    TIPOS.redefinirTipoVariable(uno, resultado);
  }
  return resultado;
}

TIPOS.distintos = function(t1, t2) {
  if (t1.id == "ERROR" || t2.id == "ERROR") { return false; }
  if (t1.id != t2.id) {
    return true;
  }
  if (t1.id=="VAR") {
    return t1.v != t2.v;
  }
  if (t1.id=="LISTA") {
    return TIPOS.distintos(t1.alfa, t2.alfa);
  }
  return false;
};

TIPOS.colisionan = function(uno, otro) {
  const variables_uno = TIPOS.variablesEn(uno);
  for (v of TIPOS.variablesEn(otro)) {
    if (variables_uno.includes(v)) {
      return true;
    }
  }
  return false;
};

TIPOS.variablesEn = function(tipo) {
  if (tipo.id=="VAR") {
    return [tipo.i]
  }
  if (tipo.id=="LISTA") {
    return TIPOS.variablesEn(tipo.alfa);
  }
  if (tipo.id=="ERROR") {
    return [0]; // Para detectar errores rápido
  }
  return [];
};

TIPOS.fallo = function(tipo) {
  return TIPOS.variablesEn(tipo).includes(0);
};

// DEFINICIONES DE TIPOS

// Retorna el índice de la próxima variable fresca
TIPOS.fresca = function() {
  TIPOS.i++;
  return TIPOS.i;
};

// Variable fresca (se corresponde a una variable de usuario)
TIPOS.VAR = function(v_id) {
  if (v_id in Inferencia.mapa_de_variables) { return Inferencia.mapa_de_variables[v_id].tipo; }
  let i = TIPOS.fresca();
  return {
    id:"VAR", str: "variable fresca " + i,
    v:v_id, i:i, src:"V", // Variable
    unificar: function(otro) { return otro; }
  };
};

// Variable fresca auxiliar (no se corresponde a una variable sino a un bloque sin variable asociada)
TIPOS.AUXVAR = function(b_id) {
  if (b_id in Inferencia.variables_auxiliares) { return Inferencia.variables_auxiliares[b_id].tipo; }
  let i = TIPOS.fresca();
  let tipo = {
    id:"VAR", str: "variable fresca " + i,
    v:b_id, i:i, src:"B", // Bloque
    unificar: function(otro) { return otro; }
  };
  Inferencia.variables_auxiliares[b_id] = {
    tipo: tipo
  };
  return tipo;
}

// Lista (alfa)
TIPOS.LISTA = function(alfa) {
  return {id:"LISTA", str: "lista de " + alfa.str, alfa:alfa,
    unificar:function(otro) {
      if (otro.id == "LISTA") {
        let tipo_unificado = TIPOS.unificar(this.alfa, otro.alfa);
        if (TIPOS.fallo(tipo_unificado)) {
          return TIPOS.INCOMPATIBLES(this, otro);
        }
        this.alfa = tipo_unificado;
        return otro;
      }
      return TIPOS.INCOMPATIBLES(this, otro);
    }
  }
};

// Entero
TIPOS.ENTERO = {id:"ENTERO", str: "entero",
  unificar:function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return otro;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Fracción
TIPOS.FRACCION = {id:"FRACCION", str: "flotante",
  unificar:function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Binario
TIPOS.BINARIO = {id:"BINARIO", str: "booleano",
  unificar:function(otro) {
    if (otro.id == "BINARIO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Texto
TIPOS.TEXTO = {id:"TEXTO", str: "string",
  unificar:function(otro) {
    if (otro.id == "CARACTER" || otro.id == "TEXTO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Caracter
TIPOS.CARACTER = {id:"CARACTER", str: "letra",
  unificar:function(otro) {
    if (otro.id == "CARACTER" || otro.id == "TEXTO") {
      return otro;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// DEFINICIONES DE ERRORES

// Cuando no puedo inferir debido a otro error
TIPOS.DIFERIDO = function(otro) {
  return {
    id:"ERROR", str:"error", strError:"error diferido",
    otro:otro,
  }
}

// Cuando dos tipos colisionan
TIPOS.COLISION = function(t1, t2) {
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) {
    console.error("ESTE DEBERÍA SER UN DIFERIDO");
  }
  return {
    id:"ERROR", str:"error", strError:"colisión entre " + t1.str + " y " + t2.str,
    t1:t1, t2:t2
  };
};

// Cuando dos tipos son incompatibles
TIPOS.INCOMPATIBLES = function(t1, t2) {
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) {
    console.error("ESTE DEBERÍA SER UN DIFERIDO");
  }
  return {
    id:"ERROR", str:"error", strError:"tipos " + t1.str + " y " + t2.str + " incompatibles",
    t1:t1, t2:t2
  };
};

TIPOS.str = function(tipo) {
  if ('strError' in tipo) {
    return "<b style='color:red'>"+tipo.strError+"</b>";
  }
  return tipo.str;
}

// FUNCIONES DE TIPO PARA CADA BLOQUE DE EXPRESIÓN

// tipo entero
const fEntero = function() { return TIPOS.ENTERO; };
for (i of ['math_round','math_modulo','math_random_int','text_length',
  'text_indexOf','lists_length','lists_indexOf']) {
  Blockly.Blocks[i].tipo = fEntero;
}

// tipo fracción
const fFraccion = function() { return TIPOS.FRACCION; };
for (i of ['math_trig','math_constant','math_random_float','math_atan2']) {
  Blockly.Blocks[i].tipo = fFraccion;
}

// tipo binario
const fBinario = function() { return TIPOS.BINARIO; };
for (i of ['logic_boolean','logic_compare','logic_operation','logic_negate',
  'math_number_property','text_isEmpty','lists_isEmpty']) {
  Blockly.Blocks[i].tipo = fBinario;
}

// tipo texto
const fTexto = function() { return TIPOS.TEXTO; };
for (i of ['text','text_join','text_getSubstring','text_changeCase','text_trim',
  'text_prompt_ext']) {
  Blockly.Blocks[i].tipo = fTexto;
}

// tipo caracter
const fCaracter = function() { return TIPOS.CARACTER; };
for (i of ['text_charAt']) {
  Blockly.Blocks[i].tipo = fCaracter;
}

// bloque numérico (puede ser entero o fracción)
Blockly.Blocks['math_number'].tipo = function() {
  if (String(this.getFieldValue('NUM')).includes(".")) {return TIPOS.FRACCION;}
  return TIPOS.ENTERO;
};

// bloque de variable
// si ya está en el mapa, retorno lo que está en el mapa
// si no, creo una nueva variable fresca y la agrego al mapa
Blockly.Blocks['variables_get'].tipo = function() {
  let v_id = Inferencia.obtenerIdVariableBloque(this);
  if (v_id in Inferencia.mapa_de_variables) {
    return Inferencia.mapa_de_variables[v_id].tipo;
  }
  let tipo = TIPOS.VAR(v_id);
  let nombre = this.getField('VAR').getText();
  let scope = obtenerScope(this, nombre);
  Inferencia.mapa_de_variables[v_id] = {
    scope: scope,
    nombre_original: nombre,
    asignaciones: [],
    tipos_a_unificar: [],
    tipo: tipo
  };
  return tipo;
};

// bloque de función
// retorno una variable fresca
Blockly.Blocks['procedures_callreturn'].tipo = function() {
  let id = Inferencia.obtenerIdFuncionBloque(this);
  if (id) return TIPOS.VAR(id);
  // Si llego acá hay un bloque procedures_call sin su procedures_def
  // Tengo que devolver algo para que no falle el algoritmo pero igual en
  // la próxima iteración este bloque va a desaparecer
  return TIPOS.AUXVAR(this.id);
};

// bloque de lista
// si todos los elementos son de tipos unificables, retorno lista de tal tipo
Blockly.Blocks['lists_create_with'].tipo = function() {
  let tipo = undefined;
  for (var i=0; i<this.itemCount_; i++) {
    let bloque = this.getInputTargetBlock("ADD"+i);
    if (bloque && bloque.tipo) {
      let otro = bloque.tipo();
      if (TIPOS.fallo(otro)) {
        return TIPOS.DIFERIDO(otro);
      }
      if (tipo) {
        let tipo_unificado = TIPOS.unificar(tipo, otro);
        if (TIPOS.fallo(tipo_unificado)) {
          Main.error(this, "TIPOS", "Todos los elementos en la lista deben ser del mismo tipo");
          return tipo_unificado;
        }
        tipo = tipo_unificado;
      } else {
        tipo = otro;
      }
    }
  }
  if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
  return TIPOS.LISTA(tipo);
};

// operador ternario
Blockly.Blocks['logic_ternary'].tipo = function() {
  let tipo = undefined;
  let A = this.getInputTargetBlock("THEN");
  if (A && A.tipo) {
    let tipoA = A.tipo();
    if (TIPOS.fallo(tipoA)) {
      return TIPOS.DIFERIDO(tipoA);
    }
    tipo = tipoA;
  }
  let B = this.getInputTargetBlock("ELSE");
  if (B && B.tipo) {
    let tipoB = B.tipo();
    if (TIPOS.fallo(tipoB)) {
      return TIPOS.DIFERIDO(tipoB);
    }
    if (tipo) {
      tipo = TIPOS.unificar(tipo, tipoB);
      if (TIPOS.fallo(tipo)) {
        Main.error(this, "TIPOS", "El tercer argumento debe ser del mismo tipo que el segundo");
        return tipo;
      }
    } else {
      tipo = tipoB;
    }
  }
  if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
  return tipo;
};

// operación aritmética binaria
Blockly.Blocks['math_arithmetic'].tipo = function() {
  let tipo = TIPOS.ENTERO;
  let A = this.getInputTargetBlock("A");
  if (A && A.tipo) {
    let tipoA = A.tipo();
    if (TIPOS.fallo(tipoA)) {
      return TIPOS.DIFERIDO(tipoA);
    }
    tipo = TIPOS.unificar(tipo, tipoA);
    if (TIPOS.fallo(tipo)) {
      Main.error(this, "TIPOS", "El primer argumento debe ser un número");
      return tipo;
    }
  }
  let B = this.getInputTargetBlock("B");
  if (B && B.tipo) {
    let tipoB = B.tipo();
    if (TIPOS.fallo(tipoB)) {
      return TIPOS.DIFERIDO(tipoB);
    }
    tipo = TIPOS.unificar(tipo, tipoB);
    if (TIPOS.fallo(tipo)) {
      Main.error(this, "TIPOS", "El segundo argumento debe ser un número");
      return tipo;
    }
  }
  return tipo;
};

// operación aritmética unaria
Blockly.Blocks['math_single'].tipo = function() {
  let op = this.getFieldValue('OP');
  if (op=="ABS" || op=="NEG") {
    let bloque = this.getInputTargetBlock("NUM");
    if (bloque && bloque.tipo) {
      let tipo = bloque.tipo();
      if (TIPOS.fallo(tipo)) {
        return TIPOS.DIFERIDO(tipo);
      }
      tipo = TIPOS.unificar(TIPOS.ENTERO, tipo);
      if (TIPOS.fallo(tipo)) {
        Main.error(this, "TIPOS", "Debe ser un número");
      }
      return tipo;
    }
    return TIPOS.ENTERO;
  }
  return TIPOS.FRACCION;
};

/*
Blockly.Blocks['math_on_list'].tipo = function() {
  let op = this.getFieldValue('OP');
  let bloque = this.getInputTargetBlock("LIST");
  let tipoLista;
  if (op=="RANDOM") {
    tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  } else {
    tipoLista = TIPOS.LISTA(TIPOS.ENTERO);
  }
  if (bloque && bloque.tipo) {
    let tipo_unificado = TIPOS.unificar(tipoLista, bloque.tipo());
    if (TIPOS.fallo(tipo_unificado)) {
      Main.error(this, "TIPOS", tipo_unificado.strError);
      return tipo_unificado;
    }
    tipoLista = tipo_unificado;
  }
  return tipoLista.alfa;
};

Blockly.Blocks['lists_repeat'].tipo = function() {
  let bloque = this.getInputTargetBlock("ITEM");
  if (bloque && bloque.tipo) {
    let rec = bloque.tipo();
    if (TIPOS.fallo(rec)) {
      Main.error(this, "TIPOS", rec.strError);
      return rec;
    }
    return TIPOS.LISTA(rec);
  }
  return TIPOS.LISTA(TIPOS.AUXVAR(this.id));
};

Blockly.Blocks['lists_getIndex'].tipo = function() {
  let bloque = this.getInputTargetBlock("VALUE");
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  if (bloque && bloque.tipo) {
    let tipo_unificado = TIPOS.unificar(tipoLista, bloque.tipo());
    if (TIPOS.fallo(tipo_unificado)) {
      Main.error(this, "TIPOS", tipo_unificado.strError);
      return tipo_unificado;
    }
    tipoLista = tipo_unificado;
  }
  return tipoLista.alfa;
};

Blockly.Blocks['lists_getSublist'].tipo = function() {
  let bloque = this.getInputTargetBlock("LIST");
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  if (bloque && bloque.tipo) {
    let tipo_unificado = TIPOS.unificar(tipoLista, bloque.tipo());
    if (TIPOS.fallo(tipo_unificado)) {
      Main.error(this, "TIPOS", tipo_unificado.strError);
      return tipo_unificado;
    }
    tipoLista = tipo_unificado;
  }
  return tipoLista;
};

Blockly.Blocks['lists_split'].tipo = function() { return TIPOS.LISTA(TIPOS.TEXTO); };

Blockly.Blocks['lists_sort'].tipo = function() {
  let op = this.getFieldValue('TYPE');
  let bloque = this.getInputTargetBlock("LIST");
  let tipoLista;
  if (op=="NUMERIC") {
    tipoLista = TIPOS.LISTA(TIPOS.ENTERO);
  } else {
    tipoLista = TIPOS.LISTA(TIPOS.TEXTO);
  }
  if (bloque && bloque.tipo) {
    let tipo_unificado = TIPOS.unificar(tipoLista, bloque.tipo());
    if (TIPOS.fallo(tipo_unificado)) {
      Main.error(this, "TIPOS", tipo_unificado.strError);
      return tipo_unificado;
    }
    tipoLista = tipo_unificado;
  }
  return tipoLista;
};
*/
