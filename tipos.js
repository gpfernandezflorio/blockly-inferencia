TIPOS = {i:0};

TIPOS.obtenerTipoVariable = function(v) {
  if (v.src == "V" && v.v in Inferencia.mapa_de_variables) {
    return Inferencia.mapa_de_variables[v.v].tipo;
  } else if (v.src == "B" && v.v in Inferencia.variables_auxiliares) {
    return Inferencia.variables_auxiliares[v.v].tipo;
  }
  return null;
};

TIPOS.redefinirTipoVariable = function(v, tipo) {
  if (v.src == "V" && v.v in Inferencia.mapa_de_variables) {
    if (TIPOS.distintos(Inferencia.mapa_de_variables[v.v].tipo, tipo)) {
      Inferencia.mapa_de_variables[v.v].tipo = tipo;
      for (v2 of Inferencia.mapa_de_variables[v.v].otras_variables_que_unifican) {
        TIPOS.redefinirTipoVariable(v2, tipo);
      }
      for (bloque of Inferencia.mapa_de_variables[v.v].bloques_dependientes) {
        bloque.tipado();
      }
    }
  } else if (v.src == "B" && v.v in Inferencia.variables_auxiliares) {
    if (TIPOS.distintos(Inferencia.variables_auxiliares[v.v].tipo, tipo)) {
      Inferencia.variables_auxiliares[v.v].tipo = tipo;
      for (v2 of Inferencia.variables_auxiliares[v.v].otras_variables_que_unifican) {
        TIPOS.redefinirTipoVariable(v2, tipo);
      }
      for (bloque of Inferencia.variables_auxiliares[v.v].bloques_dependientes) {
        bloque.tipado();
      }
    }
  }
};

// FUNCIONES BÁSICAS DE TIPOS:
// unificar, distintos, colisionan, variablesEn, fallo

TIPOS.unificar = function(uno, otro) {
  if (TIPOS.fallo(uno) || TIPOS.fallo(otro)) {
    console.error("NO PUEDO UNIFICAR ERRORES");
  }
  if (uno.id == "VAR" && otro.id == "VAR") {
    Inferencia.asociarParDeVariables(uno, otro);
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
  return (tipo && TIPOS.variablesEn(tipo).includes(0));
};

/** (Tomada de Ardublockly)
 * Uses regular expressions to identify if the input number is an integer or a
 * floating point.
 * @param {string} numberString String of the number to identify.
 * @return type.
 */
TIPOS.identifyNumber = function(numberString) {
    if (TIPOS.regExpInt_.test(numberString)) {
      var intValue = parseInt(numberString);
      if (isNaN(intValue)) {
        return null;
      }
      /*if (intValue > 32767 || intValue < -32768) {
        return LARGE_NUMBER;
      }*/
      return TIPOS.ENTERO;
    } else if (TIPOS.regExpFloat_.test(numberString)) {
      return TIPOS.FRACCION;
    }
    return null;
};
TIPOS.regExpInt_ = new RegExp(/^-?\d+$/);
TIPOS.regExpFloat_ = new RegExp(/^-?[0-9]*[.][0-9]+$/);

// DEFINICIONES DE TIPOS

// Lista de variables frescas
TIPOS.frescas = [null];

// Retorna el índice de la próxima variable fresca
TIPOS.fresca = function() {
  TIPOS.i++;
  return TIPOS.i;
};

// Variable fresca (se corresponde a una variable de usuario)
TIPOS.VAR = function(v_id) {
  if (v_id in Inferencia.mapa_de_variables) { return Inferencia.mapa_de_variables[v_id].tipo; }
  let i = TIPOS.fresca();
  let tipo = {
    id:"VAR",
    str: function() { return `${Blockly.Msg.TIPOS_VARIABLE_FRESCA} ${this.i}`; },
    str1: function() { return `${Blockly.Msg.TIPOS_VARIABLE_FRESCA1}`; },
    strs: function() { return `${Blockly.Msg.TIPOS_VARIABLE_FRESCAS}`; },
    v:v_id, i:i, src:"V", // Variable
    unificar: function(otro) { return otro; }
  };
  TIPOS.frescas.push(tipo);
  return tipo;
};

// Variable fresca auxiliar (no se corresponde a una variable sino a un bloque sin variable asociada)
TIPOS.AUXVAR = function(b_id) {
  if (b_id in Inferencia.variables_auxiliares) { return Inferencia.variables_auxiliares[b_id].tipo; }
  let i = TIPOS.fresca();
  let tipo = {
    id:"VAR",
    str: function() { return `${Blockly.Msg.TIPOS_VARIABLE_FRESCA} ${this.i}`; },
    str1: function() { return `${Blockly.Msg.TIPOS_VARIABLE_FRESCA1}`; },
    strs: function() { return `${Blockly.Msg.TIPOS_VARIABLE_FRESCAS}`; },
    v:b_id, i:i, src:"B", // Bloque
    unificar: function(otro) { return otro; }
  };
  TIPOS.frescas.push(tipo);
  Inferencia.variables_auxiliares[b_id] = {
    tipo: tipo,
    otras_variables_que_unifican: [],
    bloques_dependientes: []
  };
  return tipo;
}

// Void
TIPOS.VOID = {
  id:"VOID",
  str: function() { return "void"; },
  str1: function() { return "void" },
  strs: function() { return "void" },
  unificar: function(otro) {
    if (otro.id == "VOID") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Lista (alfa)
TIPOS.LISTA = function(alfa) {
  return {
    id:"LISTA",
    str: function() { return Blockly.Msg.TIPOS_LISTA_DE.replace("%1", this.alfa.str()); },
    str1: function() { return (this.alfa.id == "VAR" ? Blockly.Msg.TIPOS_LISTA1 : Blockly.Msg.TIPOS_LISTA_DE1.replace("%1", this.alfa.strs())); },
    strs: function() { return (this.alfa.id == "VAR" ? Blockly.Msg.TIPOS_LISTAS : Blockly.Msg.TIPOS_LISTA_DES.replace("%1", this.alfa.strs())); },
    alfa: alfa,
    unificar: function(otro) {
      if (otro.id == "LISTA") {
        let tipo_unificado = TIPOS.unificar(this.alfa, otro.alfa);
        if (TIPOS.fallo(tipo_unificado)) {
          return TIPOS.INCOMPATIBLES(this, otro);
        }
        if (TIPOS.distintos(this.alfa, tipo_unificado)) {
          this.alfa = tipo_unificado;
        }
        if (TIPOS.distintos(otro.alfa, tipo_unificado)) {
          otro.alfa = tipo_unificado;
        }
        return otro;
      }
      return TIPOS.INCOMPATIBLES(this, otro);
    }
  }
};

// Entero
TIPOS.ENTERO = {
  id:"ENTERO",
  str: function() { return Blockly.Msg.TIPOS_ENTERO; },
  // En lugar de describirlo como "número entero", lo describo simplemente como "número"
  str1: function() { return Blockly.Msg.TIPOS_NUMERO1; },
  strs: function() { return Blockly.Msg.TIPOS_NUMEROS; },
  unificar: function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return otro;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Fracción
TIPOS.FRACCION = {
  id:"FRACCION",
  str: function() { return Blockly.Msg.TIPOS_FRACCION; },
  str1: function() { return Blockly.Msg.TIPOS_FRACCION1; },
  strs: function() { return Blockly.Msg.TIPOS_FRACCIONS; },
  unificar: function(otro) {
    if (otro.id == "FRACCION" || otro.id == "ENTERO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Binario
TIPOS.BINARIO = {
  id:"BINARIO",
  str: function() { return Blockly.Msg.TIPOS_BINARIO; },
  str1: function() { return Blockly.Msg.TIPOS_BINARIO1; },
  strs: function() { return Blockly.Msg.TIPOS_BINARIOS; },
  unificar: function(otro) {
    if (otro.id == "BINARIO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Texto
TIPOS.TEXTO = {
  id:"TEXTO",
  str: function() { return Blockly.Msg.TIPOS_TEXTO; },
  str1: function() { return Blockly.Msg.TIPOS_TEXTO1; },
  strs: function() { return Blockly.Msg.TIPOS_TEXTOS; },
  unificar: function(otro) {
    if (otro.id == "CARACTER" || otro.id == "TEXTO") {
      return this;
    }
    return TIPOS.INCOMPATIBLES(this, otro);
  }
};

// Caracter
TIPOS.CARACTER = {
  id:"CARACTER",
  str: function() { return Blockly.Msg.TIPOS_CARACTER; },
  str1: function() { return Blockly.Msg.TIPOS_CARACTER1; },
  strs: function() { return Blockly.Msg.TIPOS_CARACTERS; },
  unificar: function(otro) {
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
    id:"ERROR", str: function() { return "error"; }, strError: function() { return Blockly.Msg["TIPOS_ERROR_DIFERIDO"]; },
    otro:otro, idError:"DIFERIDO"
  }
}

// Cuando dos tipos colisionan
TIPOS.COLISION = function(t1, t2) {
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) {
    console.error("ESTE DEBERÍA SER UN DIFERIDO");
  }
  return {
    id:"ERROR", str: function() { return "error"; }, strError: function() { return Blockly.Msg.TIPOS_ERROR_COLISION.replace("%1", this.t1.str()).replace("%2", this.t2.str()); },
    t1:t1, t2:t2, idError:"COLISION"
  };
};

// Cuando dos tipos son incompatibles
TIPOS.INCOMPATIBLES = function(t1, t2) {
  if (TIPOS.fallo(t1) || TIPOS.fallo(t2)) {
    console.error("ESTE DEBERÍA SER UN DIFERIDO");
  }
  return {
    id:"ERROR", str: function() { return "error"; }, strError: function() { return Blockly.Msg.TIPOS_ERROR_INCOMPATIBLES.replace("%1", this.t1.str()).replace("%2", this.t2.str()); },
    t1:t1, t2:t2, idError:"INCOMPATIBLES", sugerido:t1
  };
};

TIPOS.str = function(tipo) {
  if ('strError' in tipo) {
    return "<b style='color:red'>"+tipo.strError()+"</b>";
  }
  return tipo.str();
}

// BLOQUES CON VARIABLES LIBRES

TIPOS.obtenerArgumentosDefinicion = function(bloque) {
  for (argumento of bloque.arguments_) {
    Inferencia.agregarVariableAlMapa(argumento, bloque, "VAR", false);
  }
}

// Antes de comenzar a ejecutar el algoritmo de inferencia
TIPOS.init = function() {
  TIPOS.i=0;
};

Blockly.Blocks['procedures_defreturn'].variableLibre = function(global) {
  if (global) {
    TIPOS.obtenerArgumentosDefinicion(this);
    let nombre = this.getFieldValue('NAME');
    Inferencia.agregarVariableAlMapa(nombre, this, "PROC", true);
  }
};

Blockly.Blocks['procedures_defnoreturn'].variableLibre = function(global) {
  if (global) {
    TIPOS.obtenerArgumentosDefinicion(this);
    let nombre = this.getFieldValue('NAME');
    let mapa = Inferencia.agregarVariableAlMapa(nombre, this, "PROC", true);
    mapa.tipo = TIPOS.VOID;
  }
};

Blockly.Blocks['variables_set'].variableLibre = function(global) {
  if (!global) {
    let nombre = this.getField('VAR').getText();
    Inferencia.agregarVariableAlMapa(nombre, this, "VAR", false);
  }
};

// FUNCIONES DE TIPADO PARA CADA BLOQUE

TIPOS.tiparArgumentosLlamado = function(bloque) {
  let nombre_procedimiento = bloque.getField('NAME').getText();
  let scope = {
    id_s: Inferencia.obtenerIdVariable(nombre_procedimiento, null, "PROC"),
    nombre_original: nombre_procedimiento
  };
  let n = 0;
  while(bloque.getInput('ARG' + n)) {
    let nombreArg = bloque.arguments_[n];
    let idArg = Inferencia.obtenerIdVariable(nombreArg, scope, "VAR");
    let tipoMapa = Inferencia.mapa_de_variables[idArg].tipo;
    let tipoArg = tipoMapa;
    let fallaAnterior = TIPOS.fallo(tipoArg);
    if (fallaAnterior) {
      if (tipoArg.idError == "INCOMPATIBLES") {
        fallaAnterior = false;
        tipoArg = tipoArg.sugerido;
      }
    }
    if (!fallaAnterior) {
      let tipoUnificado = TIPOS.verificarTipoOperando(bloque, 'ARG' + n, tipoArg, function(tipoOperando) {
        return [
          Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_ARGUMENTO.replace("%1", nombreArg)).replace("%2", tipoArg.str1()),
          Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", tipoOperando.str1())
        ]; }, "TIPOS"+n);
      if (tipoUnificado) {
        if (TIPOS.fallo(tipoUnificado) && tipoUnificado.idError == "INCOMPATIBLES") { tipoUnificado.sugerido = tipoUnificado.t2; }
        if (!TIPOS.fallo(tipoMapa)) { Inferencia.mapa_de_variables[idArg].tipo = tipoUnificado; }
      }
    }
    n++;
  }
};

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
        if ((typeof(error)=="string") || Array.isArray(error)) { Inferencia.error(bloque, tag, error); }
        else if (typeof(error)=="function") { Inferencia.error(bloque, tag, error(tipoOperando)); }
        return tipoUnificado;
      } else {
        tipoResultado = tipoUnificado;
      }
    }
  }
  return tipoResultado;
};

TIPOS.verificarTipoOperandoEntero = function(bloque, input, error, tag, errorEntero=null) {
  if (!errorEntero) {
    errorEntero = error;
  }
  let tipo = TIPOS.verificarTipoOperando(bloque, input, TIPOS.ENTERO, error, tag);
  if (tipo && TIPOS.distintos(tipo, TIPOS.ENTERO)) {
    if ((typeof(errorEntero)=="string") || Array.isArray(errorEntero)) { Inferencia.error(bloque, tag, errorEntero); }
    else if (typeof(errorEntero)=="function") { Inferencia.error(bloque, tag, errorEntero(tipo)); }
  }
  return tipo;
};

TIPOS.operandosDelMismoTipo = function(bloque, inputs, error, tag) {
  let tipoResultado = undefined;
  let primeroTipado = undefined;
  for (let i=0; i<inputs.length; i++) {
    let input = inputs[i]
    let operando = bloque.getInputTargetBlock(input);
    if (operando && operando.tipado) {
      let tipoOperando = operando.tipado();
      if (TIPOS.fallo(tipoOperando)) {
        return TIPOS.DIFERIDO(tipoOperando);
      } else {
        if (tipoResultado) {
          let tipoUnificado = TIPOS.unificar(tipoOperando, tipoResultado);
          if (TIPOS.fallo(tipoUnificado)) {
            if ((typeof(error)=="string") || Array.isArray(error)) { Inferencia.error(bloque, tag, error); }
            else if (typeof(error)=="function") { Inferencia.error(bloque, tag, error(primeroTipado, tipoResultado, i, tipoOperando)); }
            return tipoUnificado;
          } else {
            tipoResultado = tipoUnificado;
          }
        } else {
          tipoResultado = tipoOperando;
          primeroTipado = i;
        }
      }
    }
  }
  return tipoResultado;
};

TIPOS.Errores = {
  Op2: function(i1,t1,i2,t2) { return [
      Blockly.Msg.TIPOS_ERROR_2OPS,
      Blockly.Msg.TIPOS_ERROR_PERO_ORDEN.replace("%1", Blockly.Msg.TIPOS_ORDEN_1O).replace("%2", t1.str1()).replace("%3", Blockly.Msg.TIPOS_ORDEN_2O).replace("%4", t2.str1())
    ];},
  OpsList: function(i1,t1,i2,t2) { return [
      Blockly.Msg.TIPOS_ERROR_LISTOPS,
    ((i2 <= 10) ?
       Blockly.Msg.TIPOS_ERROR_PERO_ORDEN.replace("%1", Blockly.Msg["TIPOS_ORDEN_"+(i1+1)+"O"]).replace("%2", t1.str1()).replace("%3", Blockly.Msg["TIPOS_ORDEN_"+(i2+1)+"O"]).replace("%4", t2.str1())
     : Blockly.Msg.TIPOS_ERROR_PERO_SINORDEN.replace("%1", t1.str1()).replace("%2", t2.str1())
    )];},
  OpsTernario: function(i1,t1,i2,t2) { return [
      Blockly.Msg.TIPOS_ERROR_2OPS_N.replace("%1", Blockly.Msg["TIPOS_ORDEN_"+(i2+2)]).replace("%2", Blockly.Msg["TIPOS_ORDEN_"+(i1+2)+"O"]),
      Blockly.Msg.TIPOS_ERROR_PERO_ORDEN.replace("%1", Blockly.Msg["TIPOS_ORDEN_"+(i2+2)+"O"]).replace("%2", t2.str1()).replace("%3", Blockly.Msg["TIPOS_ORDEN_"+(i1+2)+"O"]).replace("%4", t1.str1())
    ];},
  NumOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_NUMERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  NumOp1: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_1)).replace("%2", Blockly.Msg.TIPOS_NUMERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  NumOp2: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_2)).replace("%2", Blockly.Msg.TIPOS_NUMERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  NumOp3: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_3)).replace("%2", Blockly.Msg.TIPOS_NUMERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  IntOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_ENTERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  IntOp1: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_1)).replace("%2", Blockly.Msg.TIPOS_ENTERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  IntOp2: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_2)).replace("%2", Blockly.Msg.TIPOS_ENTERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  IntOp3: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_3)).replace("%2", Blockly.Msg.TIPOS_ENTERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  BoolCond: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_CONDICION).replace("%2", Blockly.Msg.TIPOS_BINARIO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  BoolOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_BINARIO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  BoolOp1: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_1)).replace("%2", Blockly.Msg.TIPOS_BINARIO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  BoolOp2: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_2)).replace("%2", Blockly.Msg.TIPOS_BINARIO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  ListOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_LISTA1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  ListOp1: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_1)).replace("%2", Blockly.Msg.TIPOS_LISTA1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  ListNumOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_LISTA_DE1.replace("%1", Blockly.Msg.TIPOS_NUMEROS)),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  ListTextOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_LISTA_DE1.replace("%1", Blockly.Msg.TIPOS_TEXTOS)),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  TextOp: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO).replace("%2", Blockly.Msg.TIPOS_TEXTO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  TextOp1: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_1)).replace("%2", Blockly.Msg.TIPOS_TEXTO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  TextOp2: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_2)).replace("%2", Blockly.Msg.TIPOS_TEXTO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  IterNum: function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_ITERADOR).replace("%2", Blockly.Msg.TIPOS_NUMERO1),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];},
  IterAlfa: function(alfa) { return function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_ITERADOR).replace("%2", alfa.str1()),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];};},
  Dividendo: function(s) { return function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_DIVIDENDO).replace("%2", s),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];};},
  Divisor: function(s) { return function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_DIVISOR).replace("%2", s),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];};},
  AlfaOp2: function(alfa) { return function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg.TIPOS_ORDEN_2)).replace("%2", alfa.str1()),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];};},
  AlfaModo: function(alfa, modo) { return function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", Blockly.Msg["TIPOS_ERROR_"+modo]).replace("%2", alfa.str1()),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];};}
};

// booleano
Blockly.Blocks['logic_boolean'].tipado = function() { return TIPOS.BINARIO; };

// alternativa condicional
Blockly.Blocks['controls_if'].tipado = function() {
  let n = 0;
  while(this.getInput('IF' + n)) {
    TIPOS.verificarTipoOperando(this, 'IF' + n, TIPOS.BINARIO, TIPOS.Errores.BoolCond, "TIPOS"+n);
    n++;
  }
};

Blockly.Blocks['logic_compare'].tipado = function() {
  let op = this.getFieldValue("OP");
  if (["EQ","NEQ"].includes(op)) {
    let tipo = TIPOS.operandosDelMismoTipo(this, ["A","B"], TIPOS.Errores.Op2, "TIPOS");
    Errores.VerificarComparacionEntreFloats(this, tipo);
  } else {
    TIPOS.verificarTipoOperando(this, 'A', TIPOS.ENTERO, TIPOS.Errores.NumOp1, "TIPOS1");
    TIPOS.verificarTipoOperando(this, 'B', TIPOS.ENTERO, TIPOS.Errores.NumOp2, "TIPOS2");
  }
  return TIPOS.BINARIO;
};

Blockly.Blocks['logic_operation'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'A', TIPOS.BINARIO, TIPOS.Errores.BoolOp1, "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'B', TIPOS.BINARIO, TIPOS.Errores.BoolOp2, "TIPOS2");
  return TIPOS.BINARIO;
};

Blockly.Blocks['logic_negate'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'BOOL', TIPOS.BINARIO, TIPOS.Errores.BoolOp, "TIPOS");
  return TIPOS.BINARIO;
};

// operador ternario
Blockly.Blocks['logic_ternary'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'IF', TIPOS.BINARIO, TIPOS.Errores.BoolOp1, "TIPOS1");
  let tipo = TIPOS.operandosDelMismoTipo(this, ["THEN","ELSE"], TIPOS.Errores.OpsTernario, "TIPOS2");
  if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
  return tipo;
};

// repetición simple
Blockly.Blocks['controls_repeat_ext'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'TIMES', TIPOS.Errores.NumOp, "TIPOS", TIPOS.Errores.IntOp);
};

// repetición condicional
Blockly.Blocks['controls_whileUntil'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'BOOL', TIPOS.BINARIO, TIPOS.Errores.BoolCond, "TIPOS");
};

// repetición con iterador
Blockly.Blocks['controls_for'].tipado = function() {
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  let tipoInicial = TIPOS.verificarTipoOperando(this, 'FROM', TIPOS.ENTERO, TIPOS.Errores.NumOp1, "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'TO', TIPOS.ENTERO, TIPOS.Errores.NumOp2, "TIPOS2");
  let tipoPaso = TIPOS.verificarTipoOperando(this, 'BY', TIPOS.ENTERO, TIPOS.Errores.NumOp3, "TIPOS3");
  if (tipoVariable === undefined) { return; }
  tipoVariable = tipoVariable.tipo;
  if (TIPOS.fallo(tipoVariable)) { return; }
  let tipoIterador = TIPOS.ENTERO;
  if ((tipoInicial && !TIPOS.fallo(tipoInicial) && tipoInicial.id == "FRACCION") || (tipoPaso && !TIPOS.fallo(tipoPaso) && tipoPaso.id == "FRACCION")) {
    tipoIterador = TIPOS.FRACCION;
  }
  tipoVariable = TIPOS.unificar(tipoVariable, tipoIterador);
  if (TIPOS.fallo(tipoVariable)) {
    Inferencia.error(this, "TIPOS4", TIPOS.Errores.IterNum);
  }
};

// repetición en lista
Blockly.Blocks['controls_forEach'].tipado = function() {
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  let tipoOperando = TIPOS.verificarTipoOperando(this, 'LIST', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), TIPOS.Errores.ListOp, "TIPOS1");
  if (TIPOS.fallo(tipoOperando)) { return; }
  if (tipoVariable === undefined) { return; }
  tipoVariable = tipoVariable.tipo;
  if (TIPOS.fallo(tipoVariable)) { return; }
  if (tipoOperando) {
    let alfa = tipoOperando.alfa;
    tipoOperando = TIPOS.unificar(tipoOperando, TIPOS.LISTA(tipoVariable));
    if (TIPOS.fallo(tipoOperando)) { Inferencia.error(this, "TIPOS2", TIPOS.Errores.IterAlfa(alfa)); }
  }
};

Blockly.Blocks['controls_flow_statements'].tipado = function() {
  let tope = this;
  const bloquesLoop = Blockly.Constants.Loops.CONTROL_FLOW_IN_LOOP_CHECK_MIXIN.LOOP_TYPES;
  while(tope) {
    if (bloquesLoop.includes(tope.type)) { return; }
    tope = tope.getSurroundParent();
  }
  // Si está suelto, ya tiene una advertencia así que esta sólo se la doy si no está suelto
  if (Inferencia.topeScope(this)) {
    Inferencia.advertencia(this, "PARENT", Blockly.Msg.TIPOS_ERROR_PARENT_LOOP);
  }
};

// bloque numérico (puede ser entero o fracción)
Blockly.Blocks['math_number'].tipado = function() {
  let tipo = TIPOS.identifyNumber(this.getFieldValue('NUM'));
  if (tipo) return tipo;
  // Si llego acá es porque el string es inválido pero eso no debería poder pasar
  // Por las dudas, devuelvo int
  return TIPOS.ENTERO;
};

// operación aritmética binaria
Blockly.Blocks['math_arithmetic'].tipado = function() {
  Errores.verificarDivisionPorCero(this);
  let tipoA = TIPOS.verificarTipoOperando(this, 'A', TIPOS.ENTERO, TIPOS.Errores.NumOp1, "TIPOS1");
  let tipoB = TIPOS.verificarTipoOperando(this, 'B', TIPOS.ENTERO, TIPOS.Errores.NumOp2, "TIPOS2");
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
  if (['LN','LOG10'].includes(op)) { Errores.VerificarLogaritmoPositivo(bloque); }
  let tipo = TIPOS.verificarTipoOperando(this, 'NUM', TIPOS.ENTERO, TIPOS.Errores.NumOp, "TIPOS");
  if (op=="ABS" || op=="NEG") {
    if (tipo) { return tipo; }
    return TIPOS.ENTERO;
  }
  return TIPOS.FRACCION;
};

// operación trigonométrica
Blockly.Blocks['math_trig'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'NUM', TIPOS.ENTERO, TIPOS.Errores.NumOp, "TIPOS");
  return TIPOS.FRACCION;
};

// constante matemática
Blockly.Blocks['math_constant'].tipado = function() { return TIPOS.FRACCION; };

// propiedad matemática
Blockly.Blocks['math_number_property'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'NUMBER_TO_CHECK', TIPOS.ENTERO, TIPOS.Errores.NumOp, "TIPOS");
  return TIPOS.BINARIO;
};

// redondear
Blockly.Blocks['math_round'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'NUM', TIPOS.ENTERO, TIPOS.Errores.NumOp, "TIPOS");
  return TIPOS.ENTERO;
};

// resto
Blockly.Blocks['math_modulo'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'DIVIDEND', TIPOS.Errores.Dividendo(Blockly.Msg.TIPOS_NUMERO1), "TIPOS1", TIPOS.Errores.Dividendo(Blockly.Msg.TIPOS_ENTERO1));
  TIPOS.verificarTipoOperandoEntero(this, 'DIVISOR', TIPOS.Errores.Divisor(Blockly.Msg.TIPOS_NUMERO1), "TIPOS2", TIPOS.Errores.Divisor(Blockly.Msg.TIPOS_ENTERO1));
  return TIPOS.ENTERO;
};

// entero aleatorio
Blockly.Blocks['math_random_int'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'FROM', TIPOS.ENTERO, TIPOS.Errores.NumOp1, "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'TO', TIPOS.ENTERO, TIPOS.Errores.NumOp2, "TIPOS2");
  return TIPOS.ENTERO;
};

// flotante aleatorio
Blockly.Blocks['math_random_float'].tipado = function() { return TIPOS.FRACCION; };

// arcotangente
Blockly.Blocks['math_atan2'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'X', TIPOS.ENTERO, TIPOS.Errores.NumOp1, "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'Y', TIPOS.ENTERO, TIPOS.Errores.NumOp2, "TIPOS2");
  return TIPOS.FRACCION;
};

// bloques de texto
TIPOS.fTexto = function() { return TIPOS.TEXTO; };
for (i of ['text','text_join']) {
  Blockly.Blocks[i].tipado = TIPOS.fTexto;
}

// longitud de texto
Blockly.Blocks['text_length'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, TIPOS.Errores.TextOp, "TIPOS");
  return TIPOS.ENTERO;
};

// texto vacío
Blockly.Blocks['text_isEmpty'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, TIPOS.Errores.TextOp, "TIPOS");
  return TIPOS.BINARIO;
};

// encontrar texto
Blockly.Blocks['text_indexOf'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, TIPOS.Errores.TextOp1, "TIPOS1");
  TIPOS.verificarTipoOperando(this, 'FIND', TIPOS.TEXTO, TIPOS.Errores.TextOp2, "TIPOS2");
  return TIPOS.ENTERO;
};

// indexar texto
Blockly.Blocks['text_charAt'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.TEXTO, TIPOS.Errores.TextOp1, "TIPOS1");
  TIPOS.verificarTipoOperandoEntero(this, 'AT', TIPOS.Errores.NumOp2, "TIPOS2", TIPOS.Errores.IntOp2);
  return TIPOS.CARACTER;
};

// indexar texto
Blockly.Blocks['text_getSubstring'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'STRING', TIPOS.TEXTO, TIPOS.Errores.TextOp1, "TIPOS1");
  TIPOS.verificarTipoOperandoEntero(this, 'AT1', TIPOS.Errores.NumOp2, "TIPOS2", TIPOS.Errores.IntOp2,);
  TIPOS.verificarTipoOperandoEntero(this, 'AT2', TIPOS.Errores.NumOp3, "TIPOS3", TIPOS.Errores.IntOp3,);
  return TIPOS.TEXTO;
};

// case
Blockly.Blocks['text_changeCase'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'TEXT', TIPOS.TEXTO, TIPOS.Errores.TextOp, "TIPOS");
  return TIPOS.TEXTO;
};

// espacios
Blockly.Blocks['text_trim'].tipado = function() {
  //TIPOS.verificarTipoOperando(this, 'TEXT', TIPOS.TEXTO, TIPOS.Errores.TextOp, "TIPOS");
  return TIPOS.TEXTO;
};

// longitud de texto
Blockly.Blocks['text_prompt_ext'].tipado = function() {
  if (this.getFieldValue('TYPE')=="TEXT") { return TIPOS.TEXTO; }
  return TIPOS.ENTERO;
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
        tipoAnterior = tipoAnterior.sugerido;
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
          Inferencia.error(bloque, "TIPOS", [
            Blockly.Msg.TIPOS_ERROR_VARIABLE_1
              .replace("%1", obj)
              .replace("%2", mapa.nombre_original)
              .replace("%3", tipoAnterior.str1()),
            Blockly.Msg.TIPOS_ERROR_VARIABLE_2
              .replace("%1", tipo.str1())
          ]);
        }
        if (!fallaAnterior) {
          for (i of TIPOS.variablesEn(unificacion)) {
            if (TIPOS.frescas[i]) {
              let src = TIPOS.frescas[i].src;
              let id = TIPOS.frescas[i].v;
              if (src == "V" && id in Inferencia.mapa_de_variables) {
                Inferencia.mapa_de_variables[id].bloques_dependientes.push(bloque);
              } else if (src == "B" && id in Inferencia.variables_auxiliares) {
                Inferencia.variables_auxiliares[id].bloques_dependientes.push(bloque);
              }
            }
          }
          mapa.tipo = unificacion;
        }
      }
    }
  }
};

// asignar variable
Blockly.Blocks['variables_set'].tipado = function() {
  let obj = Blockly.Msg.TIPOS_VARIABLE1;
  if (Inferencia.esUnArgumento(this.getField("VAR").getText(), this)) { obj = Blockly.Msg.TIPOS_ARGUMENTO1; }
  let v_id = Inferencia.obtenerIdVariableBloque(this);
  TIPOS.tipadoVariable(this, v_id, "VALUE", obj);
};

// definición de función
Blockly.Blocks['procedures_defreturn'].tipado = function() {
  let v_id = Inferencia.obtenerIdFuncionBloque(this);
  TIPOS.tipadoVariable(this, v_id, "RETURN", Blockly.Msg.TIPOS_FUNCION1);
};

// llamado a un procedimiento
Blockly.Blocks['procedures_callnoreturn'].tipado = function() {
  TIPOS.tiparArgumentosLlamado(this);
}

// llamado a función
// retorno una variable fresca
Blockly.Blocks['procedures_callreturn'].tipado = function() {
  TIPOS.tiparArgumentosLlamado(this);
  let id = Inferencia.obtenerIdFuncionBloque(this);
  if (id) return TIPOS.VAR(id);
  // Si llego acá hay un bloque procedures_call sin su procedures_def
  // Tengo que devolver algo para que no falle el algoritmo pero igual en
  // la próxima iteración este bloque va a desaparecer
  return TIPOS.AUXVAR(this.id);
};

Blockly.Blocks['procedures_ifreturn'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'CONDITION', TIPOS.BINARIO, TIPOS.Errores.BoolCond, "TIPOS");
  let tope = Inferencia.topeScope(this);
  if (tope) {
    if (/*(tope.type == 'procedures_defnoreturn') || */(tope.type == 'procedures_defreturn')) {
      let v_id = Inferencia.obtenerIdFuncionBloque(tope);
      TIPOS.tipadoVariable(this, v_id, "VALUE", Blockly.Msg.TIPOS_FUNCION1);
    } else {
      Inferencia.advertencia(this, "PARENT", Blockly.Msg.TIPOS_ERROR_PARENT_FUN);
    }
  }
};

delete Blockly.Blocks['procedures_ifreturn'].onchange;

// bloque de lista
// si todos los elementos son de tipos unificables, retorno lista de tal tipo
Blockly.Blocks['lists_create_with'].tipado = function() {
  let inputs = []
  for (var i=0; i<this.itemCount_; i++) {
    inputs.push("ADD"+i);
  }
  let tipo = TIPOS.operandosDelMismoTipo(this, inputs, TIPOS.Errores.OpsList, "TIPOS");
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
    error = TIPOS.Errores.ListOp;
  } else {
    tipoLista = TIPOS.LISTA(TIPOS.ENTERO);
    error = TIPOS.Errores.ListNumOp;
  }
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, error, "TIPOS");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado.alfa;
};

Blockly.Blocks['lists_repeat'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'NUM', TIPOS.Errores.NumOp2, "TIPOS", TIPOS.Errores.IntOp2);
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
  TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), TIPOS.Errores.ListOp, "TIPOS");
  return TIPOS.ENTERO;
};

// lista vacía
Blockly.Blocks['lists_isEmpty'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'VALUE', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), TIPOS.Errores.ListOp, "TIPOS");
  return TIPOS.BINARIO;
};

// Índice de elemento en lista
Blockly.Blocks['lists_indexOf'].tipado = function() {
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "VALUE", tipoLista, TIPOS.Errores.ListOp1, "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  TIPOS.verificarTipoOperando(this, 'FIND', tipoListaUnificado.alfa, TIPOS.Errores.AlfaOp2(tipoListaUnificado.alfa), "TIPOS2");
  return TIPOS.ENTERO;
};

Blockly.Blocks['lists_getIndex'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT', TIPOS.Errores.NumOp2, "TIPOS2", TIPOS.Errores.IntOp2);
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "VALUE", tipoLista, TIPOS.Errores.ListOp1, "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado.alfa;
};

Blockly.Blocks['lists_setIndex'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT', TIPOS.Errores.NumOp2, "TIPOS2", TIPOS.Errores.IntOp2);
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, TIPOS.Errores.ListOp1, "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  var modo = this.getFieldValue('MODE');
  TIPOS.verificarTipoOperando(this, 'TO', tipoListaUnificado.alfa, TIPOS.Errores.AlfaModo(tipoListaUnificado.alfa, modo), "TIPOS3");
};

// Obtener sublista
Blockly.Blocks['lists_getSublist'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT1', TIPOS.Errores.NumOp2, "TIPOS2", TIPOS.Errores.IntOp2);
  TIPOS.verificarTipoOperandoEntero(this, 'AT2', TIPOS.Errores.NumOp3, "TIPOS3", TIPOS.Errores.IntOp3);
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, TIPOS.Errores.ListOp1, "TIPOS1");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado;
};

// conversión texto <-> lista
Blockly.Blocks['lists_split'].tipado = function() {
  TIPOS.verificarTipoOperando(this, 'DELIM', TIPOS.TEXTO, TIPOS.Errores.TextOp2, "TIPOS2");
  let modo = this.getFieldValue('MODE');
  if (modo == 'SPLIT') {
    TIPOS.verificarTipoOperando(this, 'INPUT', TIPOS.TEXTO, TIPOS.Errores.TextOp1, "TIPOS1");
    return TIPOS.LISTA(TIPOS.TEXTO);
  }
  TIPOS.verificarTipoOperando(this, 'INPUT', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), TIPOS.Errores.ListOp1, "TIPOS2");
  return TIPOS.TEXTO;
};

// Ordernar lista
Blockly.Blocks['lists_sort'].tipado = function() {
  let op = this.getFieldValue('TYPE');
  let tipoLista;
  let error;
  if (op=="NUMERIC") {
    tipoLista = TIPOS.LISTA(TIPOS.ENTERO);
    error = TIPOS.Errores.ListNumOp;
  } else {
    tipoLista = TIPOS.LISTA(TIPOS.TEXTO);
    error = TIPOS.Errores.ListTextOp;
  }
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, error, "TIPOS");
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  return tipoListaUnificado;
};
