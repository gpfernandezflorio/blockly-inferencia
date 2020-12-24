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
        if (TIPOS.distintos(this.alfa, tipo_unificado)) {
          this.alfa = tipo_unificado;
          this.str = "lista de " + this.alfa.str;
        }
        if (TIPOS.distintos(otro.alfa, tipo_unificado)) {
          otro.alfa = tipo_unificado;
          otro.str = "lista de " + otro.alfa.str;
        }
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
    otro:otro, idError:"DIFERIDO"
  }
}

// Cuando dos tipos colisionan
TIPOS.COLISION = function(t1, t2) {
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) {
    console.error("ESTE DEBERÍA SER UN DIFERIDO");
  }
  return {
    id:"ERROR", str:"error", strError:"colisión entre " + t1.str + " y " + t2.str,
    t1:t1, t2:t2, idError:"COLISION"
  };
};

// Cuando dos tipos son incompatibles
TIPOS.INCOMPATIBLES = function(t1, t2) {
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) {
    console.error("ESTE DEBERÍA SER UN DIFERIDO");
  }
  return {
    id:"ERROR", str:"error", strError:"tipos " + t1.str + " y " + t2.str + " incompatibles",
    t1:t1, t2:t2, idError:"INCOMPATIBLES"
  };
};

TIPOS.str = function(tipo) {
  if ('strError' in tipo) {
    return "<b style='color:red'>"+tipo.strError+"</b>";
  }
  return tipo.str;
}

// BLOQUES CON VARIABLES LIBRES

TIPOS.inicializar = function() {
  Blockly.Blocks['procedures_defreturn'].variableLibre = function(global) {
    if (global) {
      let nombre = this.getFieldValue('NAME');
      Inferencia.agregarVariableAlMapa(nombre, this, "PROC", true);
    }
  };

  Blockly.Blocks['variables_global_def'].variableLibre = function(global) {
    if (global && Main.modo_variables != "LOCALES") {
      let nombre = this.getField('VAR').getText();
      Inferencia.agregarVariableAlMapa(nombre, this, "VAR", true);
    }
  };

  Blockly.Blocks['variables_set'].variableLibre = function(global) {
    if (!global) {
      let nombre = this.getField('VAR').getText();
      Inferencia.agregarVariableAlMapa(nombre, this, "VAR", false);
    }
  };
}

// FUNCIONES DE TIPADO PARA CADA BLOQUE

TIPOS.verificarTipoOperando = function(bloque, input, tipo, error, tag) {
  let tipoResultado = undefined;
  let operando = bloque.getInputTargetBlock(input);
  if (operando && operando.tipado) {
    let tipoOperando = operando.tipado();
    if (TIPOS.fallo(tipoOperando)) {
      return TIPOS.DIFERIDO(tipoOperando);
    } else {
      let tipoUnificado = TIPOS.unificar(tipoOperando, tipo);
      if (TIPOS.fallo(tipoUnificado)) {
        Main.error(bloque, tag, error);
        return tipoUnificado;
      } else {
        tipoResultado = tipoUnificado;
      }
    }
  }
  return tipoResultado;
};

TIPOS.verificarTipoOperandoEntero = function(bloque, input, error, tag) {
  let tipo = TIPOS.verificarTipoOperando(bloque, input, TIPOS.ENTERO, error, tag);
  if (tipo && TIPOS.distintos(tipo, TIPOS.ENTERO)) {
    Main.error(bloque, tag, error);
  }
  return tipo;
}

TIPOS.operandosDelMismoTipo = function(bloque, inputs, error, tag) {
  let tipoResultado = undefined;
  for (input of inputs) {
    let operando = bloque.getInputTargetBlock(input);
    if (operando && operando.tipado) {
      let tipoOperando = operando.tipado();
      if (TIPOS.fallo(tipoOperando)) {
        return TIPOS.DIFERIDO(tipoOperando);
      } else {
        if (tipoResultado) {
          let tipoUnificado = TIPOS.unificar(tipoOperando, tipoResultado);
          if (TIPOS.fallo(tipoUnificado)) {
            Main.error(bloque, tag, error);
            return tipoUnificado;
          } else {
            tipoResultado = tipoUnificado;
          }
        } else {
          tipoResultado = tipoOperando;
        }
      }
    }
  }
  return tipoResultado;
};

// booleano
Blockly.Blocks['logic_boolean'].tipado = function() { return TIPOS.BINARIO; };

// alternativa condicional
Blockly.Blocks['controls_if'].tipado = function() {
  let n = 0;
  while(this.getInput('IF' + n)) {
    TIPOS.verificarTipoOperando(this, 'IF' + n, TIPOS.BINARIO, "La condición debe ser binaria", "TIPOS"+n);
    n++;
  }
};

Blockly.Blocks['logic_compare'].tipado = function() {
  let op = this.getFieldValue("OP");
  if (["EQ","NEQ"].includes(op)) {
    TIPOS.operandosDelMismoTipo(this, ["A","B"], "Los operandos deben ser del mismo tipo", "TIPOS");
  } else {
    TIPOS.verificarTipoOperando(this, 'A', TIPOS.ENTERO, "El primer operando tiene que ser un número", "TIPOS1");
    TIPOS.verificarTipoOperando(this, 'B', TIPOS.ENTERO, "El segundo operando tiene que ser un número", "TIPOS2");
  }
  return TIPOS.BINARIO;
};

Blockly.Blocks['logic_operation'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'A', TIPOS.BINARIO, "El primer operando tiene que ser un binario", "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'B', TIPOS.BINARIO, "El primer operando tiene que ser un binario", "TIPOS2");
  return TIPOS.BINARIO;
};

Blockly.Blocks['logic_negate'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'BOOL', TIPOS.BINARIO, "El operando tiene que ser un binario", "TIPOS");
  return TIPOS.BINARIO;
};

// operador ternario
Blockly.Blocks['logic_ternary'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'IF', TIPOS.BINARIO, "El primer operando tiene que ser un binario", "TIPOS1");
  let tipo = TIPOS.operandosDelMismoTipo(this, ["THEN","ELSE"], "El tercer operando debe ser del mismo tipo que el segundo", "TIPOS2");
  if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
  return tipo;
};

// repetición simple
Blockly.Blocks['controls_repeat_ext'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'TIMES', "El operando tiene que ser un número entero", "TIPOS");
};

// repetición condicional
Blockly.Blocks['controls_whileUntil'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'BOOL', TIPOS.BINARIO, "El operando tiene que ser un binario", "TIPOS");
};

// repetición con iterador
Blockly.Blocks['controls_for'].tipado = function() {
  let tipoInicial = TIPOS.verificarTipoOperando(this, 'FROM', TIPOS.ENTERO, "El primer operando tiene que ser un número", "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'TO', TIPOS.ENTERO, "El segundo operando tiene que ser un número", "TIPOS2");
  let tipoPaso = TIPOS.verificarTipoOperando(this, 'BY', TIPOS.ENTERO, "El tercer operando tiene que ser un número", "TIPOS3");
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  if (tipoVariable === undefined) { return; }
  tipoVariable = tipoVariable.tipo;
  if (TIPOS.fallo(tipoVariable)) { return; }
  let tipoIterador = TIPOS.ENTERO;
  if ((tipoInicial && !TIPOS.fallo(tipoInicial) && tipoInicial.id == "FRACCION") || (tipoPaso && !TIPOS.fallo(tipoPaso) && tipoPaso.id == "FRACCION")) {
    tipoIterador = TIPOS.FRACCION;
  }
  tipoVariable = TIPOS.unificar(tipoVariable, tipoIterador);
  if (TIPOS.fallo(tipoVariable)) {
    Main.error(this, "TIPOS4", "El iterador tiene que ser un número");
  }
};

// repetición en lista
Blockly.Blocks['controls_forEach'].tipado = function() {
  let tipoOperando = TIPOS.verificarTipoOperando(this, 'LIST', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), "El operando tiene que ser una lista", "TIPOS1");
  if (tipoOperando && TIPOS.fallo(tipoOperando)) { return; }
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  if (tipoVariable === undefined) { return; }
  tipoVariable = tipoVariable.tipo;
  if (TIPOS.fallo(tipoVariable)) { return; }
  if (tipoOperando) {
    let alfa = tipoOperando.alfa;
    tipoOperando = TIPOS.unificar(tipoOperando, TIPOS.LISTA(tipoVariable));
    if (TIPOS.fallo(tipoOperando)) { Main.error(this, "TIPOS2", "El iterador tiene que ser "+alfa.str); }
  }
};

// bloque numérico (puede ser entero o fracción)
Blockly.Blocks['math_number'].tipado = function() {
  if (String(this.getFieldValue('NUM')).includes(".")) { return TIPOS.FRACCION; }
  return TIPOS.ENTERO;
};

// operación aritmética binaria
Blockly.Blocks['math_arithmetic'].tipado = function() {
  let tipoA = TIPOS.verificarTipoOperando(this, 'A', TIPOS.ENTERO, "El primer operando tiene que ser un número", "TIPOS1");
  let tipoB = TIPOS.verificarTipoOperando(this, 'B', TIPOS.ENTERO, "El segundo operando tiene que ser un número", "TIPOS2");
  if (tipoA) {
    if (TIPOS.fallo(tipoA)) { return tipoA; }
    if (tipoB) {
      if (TIPOS.fallo(tipoB)) { return tipoB; }
      return TIPOS.unificar(tipoA, tipoB); // No puede fallar porque ambos unifican con entero
    }
    return tipoA;
  } else if (tipoB) {
    return tipoB;
  }
  return TIPOS.ENTERO;
};

// operación aritmética unaria
Blockly.Blocks['math_single'].tipado = function() {
  let op = this.getFieldValue('OP');
  let tipo = TIPOS.verificarTipoOperando(this, 'NUM', TIPOS.ENTERO, "El operando tiene que ser un número", "TIPOS");
  if (op=="ABS" || op=="NEG") {
    if (tipo) { return tipo; }
    return TIPOS.ENTERO;
  }
  return TIPOS.FRACCION;
};

// operación trigonométrica
Blockly.Blocks['math_trig'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'NUM', TIPOS.ENTERO, "El operando tiene que ser un número", "TIPOS");
  return TIPOS.FRACCION;
};

// constante matemática
Blockly.Blocks['math_constant'].tipado = function() { return TIPOS.FRACCION; };

// propiedad matemática
Blockly.Blocks['math_number_property'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'NUMBER_TO_CHECK', TIPOS.ENTERO, "El operando tiene que ser un número", "TIPOS");
  return TIPOS.BINARIO;
};

// redondear
Blockly.Blocks['math_round'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'NUM', TIPOS.ENTERO, "El operando tiene que ser un número", "TIPOS");
  return TIPOS.ENTERO;
};

// resto
Blockly.Blocks['math_modulo'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'DIVIDEND', "El dividendo tiene que ser un número entero", "TIPOS1");
  TIPOS.verificarTipoOperandoEntero(this, 'DIVISOR', "El divisor tiene que ser un número entero", "TIPOS2");
  return TIPOS.ENTERO;
};

// entero aleatorio
Blockly.Blocks['math_random_int'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'FROM', TIPOS.ENTERO, "El primer operando tiene que ser un número", "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'TO', TIPOS.ENTERO, "El segundo operando tiene que ser un número", "TIPOS2");
  return TIPOS.ENTERO;
};

// flotante aleatorio
Blockly.Blocks['math_random_float'].tipado = function() { return TIPOS.FRACCION; };

// arcotangente
Blockly.Blocks['math_atan2'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'X', TIPOS.ENTERO, "El primer operando tiene que ser un número", "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'Y', TIPOS.ENTERO, "El segundo operando tiene que ser un número", "TIPOS2");
  return TIPOS.FRACCION;
};

// bloques de texto
const fTexto = function() { return TIPOS.TEXTO; };
for (i of ['text','text_join','text_prompt_ext']) {
  Blockly.Blocks[i].tipado = fTexto;
}

// longitud de texto
Blockly.Blocks['text_length'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, "El operando tiene que ser un texto", "TIPOS");
  return TIPOS.ENTERO;
};

// texto vacío
Blockly.Blocks['text_isEmpty'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, "El operando tiene que ser un texto", "TIPOS");
  return TIPOS.BINARIO;
};

// encontrar texto
Blockly.Blocks['text_indexOf'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, "El primer operando tiene que ser un texto", "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'FIND', TIPOS.TEXTO, "El segundo operando tiene que ser un texto", "TIPOS2");
  return TIPOS.ENTERO;
};

// indexar texto
Blockly.Blocks['text_charAt'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, "El primer operando tiene que ser un texto", "TIPOS1");
  TIPOS.verificarTipoOperandoEntero(this, 'AT', "El segundo operando tiene que ser un número entero", "TIPOS2");
  return TIPOS.CARACTER;
};

// indexar texto
Blockly.Blocks['text_getSubstring'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'STRING', TIPOS.TEXTO, "El primer operando tiene que ser un texto", "TIPOS1");
  TIPOS.verificarTipoOperandoEntero(this, 'AT1', "El segundo operando tiene que ser un número entero", "TIPOS2");
  TIPOS.verificarTipoOperandoEntero(this, 'AT2', "El tercer operando tiene que ser un número entero", "TIPOS3");
  return TIPOS.TEXTO;
};

// case
Blockly.Blocks['text_changeCase'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'TEXT', TIPOS.TEXTO, "El operando tiene que ser un texto", "TIPOS");
  return TIPOS.TEXTO;
};

// espacios
Blockly.Blocks['text_trim'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'TEXT', TIPOS.TEXTO, "El operando tiene que ser un texto", "TIPOS");
  return TIPOS.TEXTO;
};

// obtener variable
// si ya está en el mapa, retorno lo que está en el mapa
// si no, creo una nueva variable fresca y la agrego al mapa
Blockly.Blocks['variables_get'].tipado = function() {
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  if (tipoVariable === undefined) { return TIPOS.AUXVAR(this.id); }
  return tipoVariable.tipo;
};

TIPOS.tipadoVariable = function(bloque, v_id, argumento, obj) {
  if (v_id in Inferencia.mapa_de_variables) {
    let mapa = Inferencia.mapa_de_variables[v_id];
    let tipoAnterior = mapa.tipo;
    let fallaAnterior = TIPOS.fallo(tipoAnterior);
    if (fallaAnterior) {
      if (tipoAnterior.idError == "INCOMPATIBLES") {
        tipoAnterior = tipoAnterior.t1;
      } else { return; }
    }
    let bloqueArgumento = bloque.getInputTargetBlock(argumento);
    if (bloqueArgumento && bloqueArgumento.tipado) {
      let tipo = bloqueArgumento.tipado();
      if (TIPOS.fallo(tipo)) {
        if (!fallaAnterior) { mapa.tipo = TIPOS.DIFERIDO(tipo); }
      } else {
        let unificacion = TIPOS.unificar(tipoAnterior, tipo);
        if (TIPOS.fallo(unificacion)) {
          Main.error(bloque, "TIPOS1",
          "A la " + obj + " " + mapa.nombre_original + " ya se le había asignado el tipo " + tipoAnterior.str
          );
          Main.error(bloque, "TIPOS2",
          " y ahora se le está asignando el tipo " + tipo.str
          );
        }
        if (!fallaAnterior) { mapa.tipo = unificacion; }
      }
    }
  }
}

// asignar variable
Blockly.Blocks['variables_set'].tipado = function() {
  let v_id = Inferencia.obtenerIdVariableBloque(this);
  TIPOS.tipadoVariable(this, v_id, "VALUE", "variable");
};

// definición de función
Blockly.Blocks['procedures_defreturn'].tipado = function() {
  let v_id = Inferencia.obtenerIdFuncionBloque(this);
  TIPOS.tipadoVariable(this, v_id, "RETURN", "función");
};

// llamado a función
// retorno una variable fresca
Blockly.Blocks['procedures_callreturn'].tipado = function() {
  let id = Inferencia.obtenerIdFuncionBloque(this);
  if (id) return TIPOS.VAR(id);
  // Si llego acá hay un bloque procedures_call sin su procedures_def
  // Tengo que devolver algo para que no falle el algoritmo pero igual en
  // la próxima iteración este bloque va a desaparecer
  return TIPOS.AUXVAR(this.id);
};

// bloque de lista
// si todos los elementos son de tipos unificables, retorno lista de tal tipo
Blockly.Blocks['lists_create_with'].tipado = function() {
  let inputs = []
  for (var i=0; i<this.itemCount_; i++) {
    inputs.push("ADD"+i);
  }
  let tipo = TIPOS.operandosDelMismoTipo(this, inputs, "Todos los elementos en la lista deben ser del mismo tipo", "TIPOS");
  if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
  if (TIPOS.fallo(tipo)) { return TIPOS.DIFERIDO(tipo); }
  return TIPOS.LISTA(tipo);
};

Blockly.Blocks['math_on_list'].tipado = function() {
  let op = this.getFieldValue('OP');
  let tipoLista;
  let error;
  if (op=="RANDOM") {
    tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
    error = "El operando debe ser una lista";
  } else {
    tipoLista = TIPOS.LISTA(TIPOS.ENTERO);
    error = "El operando debe ser una lista de números";
  }
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, error, "TIPOS");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado.alfa;
};

Blockly.Blocks['lists_repeat'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'NUM', "El segundo operando tiene que ser un número entero", "TIPOS");
  let bloque = this.getInputTargetBlock("ITEM");
  if (bloque && bloque.tipado) {
    let tipoElem = bloque.tipado();
    if (!TIPOS.fallo(tipoElem)) {
      return TIPOS.LISTA(tipoElem);
    }
  }
  return TIPOS.LISTA(TIPOS.AUXVAR(this.id));
};



// longitud de lista
Blockly.Blocks['lists_length'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), "El operando tiene que ser una lista", "TIPOS");
  return TIPOS.ENTERO;
};

// lista vacía
Blockly.Blocks['lists_isEmpty'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), "El operando tiene que ser una lista", "TIPOS");
  return TIPOS.BINARIO;
};

Blockly.Blocks['lists_indexOf'].tipado = function() {
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "VALUE", tipoLista, "El primer operando debe ser una lista", "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  TIPOS.verificarTipoOperando(this, 'FIND', tipoListaUnificado.alfa, "El segundo operando tiene que ser de tipo " + tipoListaUnificado.alfa.str, "TIPOS2");
  return TIPOS.ENTERO;
};

Blockly.Blocks['lists_getIndex'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT', "El segundo operando tiene que ser un número entero", "TIPOS2");
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "VALUE", tipoLista, "El primer operando debe ser una lista", "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado.alfa;
};

Blockly.Blocks['lists_setIndex'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT', "El segundo operando tiene que ser un número entero", "TIPOS2");
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, "El primer operando debe ser una lista", "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  var modo = this.getFieldValue('MODE');
  let error = "El elemento a " + (modo=="SET" ? "establecer" : "insertar") + " tiene que ser de tipo " + tipoListaUnificado.alfa.str;
  TIPOS.verificarTipoOperando(this, 'TO', tipoListaUnificado.alfa, error, "TIPOS3");
};

Blockly.Blocks['lists_getSublist'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT1', "El segundo operando tiene que ser un número entero", "TIPOS2");
  TIPOS.verificarTipoOperandoEntero(this, 'AT2', "El tercer operando tiene que ser un número entero", "TIPOS3");
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, "El primer operando debe ser una lista", "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado;
};

// conversión texto <-> lista
Blockly.Blocks['lists_split'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'DELIM', TIPOS.TEXTO, "El segundo operando tiene que ser un texto", "TIPOS1");
  let modo = this.getFieldValue('MODE');
  if (modo == 'SPLIT') {
    TIPOS.verificarTipoOperando(this, 'INPUT', TIPOS.TEXTO, "El primer operando tiene que ser un texto", "TIPOS2");
    return TIPOS.LISTA(TIPOS.TEXTO);
  }
  TIPOS.verificarTipoOperando(this, 'INPUT', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), "El primer operando tiene que ser una lista", "TIPOS2");
  return TIPOS.TEXTO;
};

Blockly.Blocks['lists_sort'].tipado = function() {
  let op = this.getFieldValue('TYPE');
  let tipoLista;
  let error;
  if (op=="NUMERIC") {
    tipoLista = TIPOS.LISTA(TIPOS.ENTERO);
    error = "El operando debe ser una lista de números";
  } else {
    tipoLista = TIPOS.LISTA(TIPOS.TEXTO);
    error = "El operando debe ser una lista de textos";
  }
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, error, "TIPOS");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado;
};
