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

TIPOS.unificar = function(uno, otro) {
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

TIPOS.COLISION = function(t1, t2) {
  let strError;
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) { strError = "error diferido"; }
  else {strError = "colisión entre " + t1.str + " y " + t2.str;}
  return {
    id:"ERROR", str:"error", strError:strError,
    t1:t1, t2:t2,
    unificar: function(otro) { return this; }
  };
};

TIPOS.INCOMPATIBLES = function(t1, t2) {
  let strError;
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) { strError = "error diferido"; }
  else {strError = "tipos " + t1.str + " y " + t2.str + " incompatibles";}
  return {
    id:"ERROR", str:"error", strError:strError,
    t1:t1, t2:t2,
    unificar: function(otro) { return this; }
  };
};

// Retorna el índice de la próxima variable fresca
TIPOS.fresca = function() {
  TIPOS.i++;
  return TIPOS.i;
};

TIPOS.AUXVAR = function(b_id) { // Variable fresca auxiliar (no se corresponde a una variable)
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

TIPOS.VAR = function(v_id) { // Variable fresca (se corresponde a una variable)
  if (v_id in Inferencia.mapa_de_variables) { return Inferencia.mapa_de_variables[v_id].tipo; }
  let i = TIPOS.fresca();
  return {
    id:"VAR", str: "variable fresca " + i,
    v:v_id, i:i, src:"V", // Variable
    unificar: function(otro) { return otro; }
  };
};

TIPOS.LISTA = function(alfa) { // Lista
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

TIPOS.ENTERO = {id:"ENTERO", str: "entero", // Entero
  unificar:function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return otro;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

TIPOS.FRACCION = {id:"FRACCION", str: "flotante", // Fracción
  unificar:function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

TIPOS.BINARIO = {id:"BINARIO", str: "booleano", // Binario
  unificar:function(otro) {
    if (otro.id == "BINARIO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

TIPOS.TEXTO = {id:"TEXTO", str: "string", // Texto
  unificar:function(otro) {
    if (otro.id == "CARACTER" || otro.id == "TEXTO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

TIPOS.CARACTER = {id:"CARACTER", str: "letra", // Texto
  unificar:function(otro) {
    if (otro.id == "CARACTER" || otro.id == "TEXTO") {
      return otro;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

TIPOS.str = function(tipo) {
  if ('strError' in tipo) {
    return "<b style='color:red'>"+tipo.strError+"</b>";
  }
  return tipo.str;
}

const fEntero = function() { return TIPOS.ENTERO; };
for (i of ['math_round','math_modulo','math_random_int','text_length',
  'text_indexOf','lists_length','lists_indexOf']) {
  Blockly.Blocks[i].tipo = fEntero;
}

const fFraccion = function() { return TIPOS.FRACCION; };
for (i of ['math_trig','math_constant','math_random_float','math_atan2']) {
  Blockly.Blocks[i].tipo = fFraccion;
}

const fBinario = function() { return TIPOS.BINARIO; };
for (i of ['logic_boolean','logic_compare','logic_operation','logic_negate',
  'math_number_property','text_isEmpty','lists_isEmpty']) {
  Blockly.Blocks[i].tipo = fBinario;
}

const fTexto = function() { return TIPOS.TEXTO; };
for (i of ['text','text_join','text_getSubstring','text_changeCase','text_trim',
  'text_prompt_ext']) {
  Blockly.Blocks[i].tipo = fTexto;
}

const fCaracter = function() { return TIPOS.CARACTER; };
for (i of ['text_charAt']) {
  Blockly.Blocks[i].tipo = fCaracter;
}

Blockly.Blocks['math_number'].tipo = function() {
  if (String(this.getFieldValue('NUM')).includes(".")) {return TIPOS.FRACCION;}
  return TIPOS.ENTERO;
};

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

Blockly.Blocks['procedures_callreturn'].tipo = function() {
  let id = Inferencia.obtenerIdFuncionBloque(this);
  if (id) return TIPOS.VAR(id);
  // Si llego acá hay un bloque procedures_call sin su procedures_def
  // Tengo que devolver algo para que no falle el algoritmo pero igual en
  // la próxima iteración este bloque va a desaparecer
  return TIPOS.AUXVAR(this.id);
};

Blockly.Blocks['lists_create_with'].tipo = function() {
  let bloque = this;
  return TIPOS.LISTA(unificadorSerial({id:bloque.id, j:-1,
    dame:function() {
      this.j++; if (this.j==bloque.itemCount_){ return undefined; }
      return bloque.getInputTargetBlock("ADD"+this.j);
    }
  }));
};

Blockly.Blocks['logic_ternary'].tipo = function() {
  let bloque = this;
  return unificadorSerial({id:bloque.id,
    dame:function(){
      this.dame = function(){
        this.dame = function() { return undefined; }
        return bloque.getInputTargetBlock("ELSE");
      }
      return bloque.getInputTargetBlock("THEN");
    }
  });
};

Blockly.Blocks['math_arithmetic'].tipo = function() {
  let bloque = this;
  return unificadorSerial({id:bloque.id,
    dame:function(){
      this.dame = function(){
        this.dame = function() { return undefined; }
        return bloque.getInputTargetBlock("B");
      }
      return bloque.getInputTargetBlock("A");
    }
  });
};

Blockly.Blocks['math_single'].tipo = function() {
  let op = this.getFieldValue('OP');
  if (op=="ABS" || op=="NEG") {
    let bloque = this.getInputTargetBlock("NUM");
    if (bloque && bloque.tipo) {
      return TIPOS.unificar(TIPOS.ENTERO, bloque.tipo());
    }
    return TIPOS.ENTERO;
  }
  return TIPOS.FRACCION;
};

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
      return tipo_unificado;
    }
    tipoLista = tipo_unificado;
  }
  return tipoLista.alfa;
};

Blockly.Blocks['lists_repeat'].tipo = function() {
  let bloque = this.getInputTargetBlock("ITEM");
  if (bloque && bloque.tipo) {
    return TIPOS.LISTA(bloque.tipo());
  }
  return TIPOS.LISTA(TIPOS.AUXVAR(this.id));
};

Blockly.Blocks['lists_getIndex'].tipo = function() {
  let bloque = this.getInputTargetBlock("VALUE");
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  if (bloque && bloque.tipo) {
    let tipo_unificado = TIPOS.unificar(tipoLista, bloque.tipo());
    if (TIPOS.fallo(tipo_unificado)) {
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
      return tipo_unificado;
    }
    tipoLista = tipo_unificado;
  }
  return tipoLista;
};

function unificadorSerial(iterador) {
  let tipo = undefined;
  let bloque = undefined;
  while ((bloque = iterador.dame()) !==undefined) {
    if (bloque && bloque.tipo) {
      if (tipo) {
        let tipo_unificado = TIPOS.unificar(tipo, bloque.tipo());
        if (TIPOS.fallo(tipo_unificado)) {
          return tipo_unificado;
        }
        tipo = tipo_unificado;
      } else {
        tipo = bloque.tipo();
      }
    }
  }
  if (tipo) return tipo;
  return TIPOS.AUXVAR(iterador.id);
}
