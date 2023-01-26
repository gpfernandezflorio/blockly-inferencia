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
        Inferencia.tipadoBloque(bloque);
      }
    }
  } else if (v.src == "B" && v.v in Inferencia.variables_auxiliares) {
    if (TIPOS.distintos(Inferencia.variables_auxiliares[v.v].tipo, tipo)) {
      Inferencia.variables_auxiliares[v.v].tipo = tipo;
      for (v2 of Inferencia.variables_auxiliares[v.v].otras_variables_que_unifican) {
        TIPOS.redefinirTipoVariable(v2, tipo);
      }
      for (bloque of Inferencia.variables_auxiliares[v.v].bloques_dependientes) {
        Inferencia.tipadoBloque(bloque);
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
  if (t1.alfa && t2.alfa) {
    return TIPOS.distintos(t1.alfa, t2.alfa);
  }
  return false;
};

TIPOS.colisionan = function(uno, otro) {
  const variables_uno = TIPOS.variablesEn(uno);
  for (let v of TIPOS.variablesEn(otro)) {
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
    str1: function(opt_count) {
      let alfa = this.alfa.strs();
      if (opt_count !== undefined) {
        if (opt_count == 1) {
          alfa = this.alfa.str1();
        } else {
          alfa = `${opt_count} ${alfa}`;
        }
      } else if (this.alfa.id == "VAR") {
        return Blockly.Msg.TIPOS_LISTA1;
      }
      return Blockly.Msg.TIPOS_LISTA_DE1.replace("%1", alfa);
    },
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

TIPOS.obtenerArgumentosDefinicion = function(bloque, opt_scope) {
  if (opt_scope === undefined) { opt_scope = bloque; }
  for (let argumento of bloque.arguments_) {
    Inferencia.agregarVariableAlMapa(argumento, opt_scope, "VAR", false);
  }
}

// Antes de comenzar a ejecutar el algoritmo de inferencia
TIPOS.init = function() {
  TIPOS.i=0;
};

Blockly.Blocks['procedures_defreturn'].variableLibre = function(global) {
  if (global) {
    TIPOS.obtenerArgumentosDefinicion(this);
    let nombre = this.getProcedureDef()[0];
    Inferencia.agregarVariableAlMapa(nombre, this, "PROC", true);
  }
};

Blockly.Blocks['procedures_defnoreturn'].variableLibre = function(global) {
  if (global) {
    TIPOS.obtenerArgumentosDefinicion(this);
    let nombre = this.getProcedureDef()[0];
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

TIPOS.tiparArgumentosLlamado = function(bloque) {
  let nombre_procedimiento = bloque.getProcedureCall();
  let scope = {
    id_s: Inferencia.obtenerIdVariable(nombre_procedimiento, null, "PROC"),
    nombre_original: nombre_procedimiento
  };
  let n = 0;
  while(bloque.getInput('ARG' + n)) {
    let nombreArg = bloque.arguments_[n];
    let idArg = Inferencia.obtenerIdVariable(nombreArg, scope, "VAR");
    if (idArg in Inferencia.mapa_de_variables) {
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
          ]; });
        if (tipoUnificado) {
          if (TIPOS.fallo(tipoUnificado) && tipoUnificado.idError == "INCOMPATIBLES") { tipoUnificado.sugerido = tipoUnificado.t2; }
          if (!TIPOS.fallo(tipoMapa)) { Inferencia.mapa_de_variables[idArg].tipo = tipoUnificado; }
        }
      }
    }
    n++;
  }
};

TIPOS.verificarTipoOperando = function(bloque, input, tipo, error) {
  let tipoResultado = undefined;
  let operando = bloque.getInputTargetBlock(input);
  let tipoOperando = Inferencia.tipo(operando);
  if (tipoOperando) {
    if (TIPOS.fallo(tipoOperando)) {
      return TIPOS.DIFERIDO(tipoOperando);
    } else {
      let tipoUnificado = TIPOS.unificar(tipoOperando, tipo);
      if (TIPOS.fallo(tipoUnificado)) {
        if ((typeof(error)=="string") || Array.isArray(error)) { Inferencia.error(bloque, `TIPOS_${input}`, error); }
        else if (typeof(error)=="function") { Inferencia.error(bloque, `TIPOS_${input}`, error(tipoOperando)); }
        return tipoUnificado;
      } else {
        tipoResultado = tipoUnificado;
      }
    }
  }
  return tipoResultado;
};

TIPOS.verificarTipoOperandoEntero = function(bloque, input, error, errorEntero=null) {
  if (!errorEntero) {
    errorEntero = error;
  }
  let tipo = TIPOS.verificarTipoOperando(bloque, input, TIPOS.ENTERO, error);
  if (tipo && TIPOS.distintos(tipo, TIPOS.ENTERO)) {
    if ((typeof(errorEntero)=="string") || Array.isArray(errorEntero)) { Inferencia.error(bloque, `TIPOS_${input}`, errorEntero); }
    else if (typeof(errorEntero)=="function") { Inferencia.error(bloque, `TIPOS_${input}`, errorEntero(tipo)); }
  }
  return tipo;
};

TIPOS.operandosDelMismoTipo = function(bloque, inputs, error, tag) {
  let tipoResultado = undefined;
  let primeroTipado = undefined;
  for (let i=0; i<inputs.length; i++) {
    let input = inputs[i]
    let operando = bloque.getInputTargetBlock(input);
    let tipoOperando = Inferencia.tipo(operando);
    if (tipoOperando) {
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
  SX: function(s, x) { return function(t) { return [
      Blockly.Msg.TIPOS_ERROR_GENERICO.replace("%1", x).replace("%2", s),
      Blockly.Msg.TIPOS_ERROR_PERO.replace("%1", t.str1())
    ];};}
};

TIPOS.inicializar = function() {
  TIPOS.Errores.SOp = function(s) { return TIPOS.Errores.SX(s, Blockly.Msg.TIPOS_ERROR_OPERANDO); };
  TIPOS.Errores.SOpN = function(s, n) { return TIPOS.Errores.SX(s, Blockly.Msg.TIPOS_ERROR_OPERANDO_N.replace("%1", Blockly.Msg[`TIPOS_ORDEN_${n}`])); };
  TIPOS.Errores.NumOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_NUMERO1);
  TIPOS.Errores.NumOpN = function(n) { return TIPOS.Errores.SOpN(Blockly.Msg.TIPOS_NUMERO1, n); };
  TIPOS.Errores.NumOp1 = TIPOS.Errores.NumOpN(1);
  TIPOS.Errores.NumOp2 = TIPOS.Errores.NumOpN(2);
  TIPOS.Errores.NumOp3 = TIPOS.Errores.NumOpN(3);
  TIPOS.Errores.IntOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_ENTERO1);
  TIPOS.Errores.IntOpN = function(n) { return TIPOS.Errores.SOpN(Blockly.Msg.TIPOS_ENTERO1, n); };
  TIPOS.Errores.IntOp1 = TIPOS.Errores.IntOpN(1);
  TIPOS.Errores.IntOp2 = TIPOS.Errores.IntOpN(2);
  TIPOS.Errores.IntOp3 = TIPOS.Errores.IntOpN(3);
  TIPOS.Errores.BoolCond = TIPOS.Errores.SX(Blockly.Msg.TIPOS_BINARIO1, Blockly.Msg.TIPOS_ERROR_CONDICION);
  TIPOS.Errores.BoolOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_BINARIO1);
  TIPOS.Errores.BoolOpN = function(n) { return TIPOS.Errores.SOpN(Blockly.Msg.TIPOS_BINARIO1, n); };
  TIPOS.Errores.BoolOp1 = TIPOS.Errores.BoolOpN(1);
  TIPOS.Errores.BoolOp2 = TIPOS.Errores.BoolOpN(2);
  TIPOS.Errores.TextOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_TEXTO1);
  TIPOS.Errores.TextOpN = function(n) { return TIPOS.Errores.SOpN(Blockly.Msg.TIPOS_TEXTO1, n); };
  TIPOS.Errores.TextOp1 = TIPOS.Errores.TextOpN(1);
  TIPOS.Errores.TextOp2 = TIPOS.Errores.TextOpN(2);
  TIPOS.Errores.ListOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_LISTA1);
  TIPOS.Errores.ListNumOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_LISTA_DE1.replace("%1", Blockly.Msg.TIPOS_NUMEROS));
  TIPOS.Errores.ListTextOp = TIPOS.Errores.SOp(Blockly.Msg.TIPOS_LISTA_DE1.replace("%1", Blockly.Msg.TIPOS_TEXTOS));
  TIPOS.Errores.ListOpN = function(n) { return TIPOS.Errores.SOpN(Blockly.Msg.TIPOS_LISTA1, n); };
  TIPOS.Errores.ListOp1 = TIPOS.Errores.ListOpN(1);
  TIPOS.Errores.AlfaOpN = function(alfa, n) { return TIPOS.Errores.SOpN(alfa.str1(), n); };
  TIPOS.Errores.AlfaOp2 = function(alfa) { return TIPOS.Errores.AlfaOpN(alfa, 2); };
  TIPOS.Errores.Dividendo = function(s) { return TIPOS.Errores.SX(s, Blockly.Msg.TIPOS_ERROR_DIVIDENDO); };
  TIPOS.Errores.Divisor = function(s) { return TIPOS.Errores.SX(s, Blockly.Msg.TIPOS_ERROR_DIVISOR); };
  TIPOS.Errores.DivnNum = TIPOS.Errores.Dividendo(Blockly.Msg.TIPOS_NUMERO1);
  TIPOS.Errores.DivnInt = TIPOS.Errores.Dividendo(Blockly.Msg.TIPOS_ENTERO1);
  TIPOS.Errores.DivsNum = TIPOS.Errores.Divisor(Blockly.Msg.TIPOS_NUMERO1);
  TIPOS.Errores.DivsInt = TIPOS.Errores.Divisor(Blockly.Msg.TIPOS_ENTERO1);
  TIPOS.Errores.AlfaModo = function(alfa, modo) { return TIPOS.Errores.SX(alfa.str1(), Blockly.Msg["TIPOS_ERROR_"+modo]); };
  TIPOS.Errores.IterAlfa = function(alfa, modo) { return TIPOS.Errores.SX(alfa.str1(), Blockly.Msg.TIPOS_ERROR_ITERADOR); };
  TIPOS.Errores.IterNum = TIPOS.Errores.SX(Blockly.Msg.TIPOS_NUMERO1, Blockly.Msg.TIPOS_ERROR_ITERADOR);
  TIPOS.Errores.Incompatibles = function(obj, nombre, tipoAnterior, tipoNuevo) { return [
    Blockly.Msg.TIPOS_ERROR_VARIABLE_1
      .replace("%1", obj)
      .replace("%2", nombre)
      .replace("%3", tipoAnterior),
    Blockly.Msg.TIPOS_ERROR_VARIABLE_2
      .replace("%1", tipoNuevo)
  ];}
};

TIPOS.verificacionesTipadoPorClave = {
  ENTERO: function(bloque, k, msgs) {
    return TIPOS.verificarTipoOperandoEntero(bloque, k, msgs[0], msgs[1]);
  },
  NUMERO: function(bloque, k, msgs) {
    return TIPOS.verificarTipoOperando(bloque, k, TIPOS.ENTERO, msgs[0]);
  }
};

TIPOS.agregarFuncionesBloques = function() {
  for (let b in Blockly.Blocks) {
    if (!('tipado' in Blockly.Blocks[b])) { // Algunos los defino a mano
      Blockly.Blocks[b].tipado = function() {
        let tipos_inputs = TIPOS.tiposEsperados.call(this);
        if (b in TIPOS.tipadoExtra) {
          TIPOS.tipadoExtra[b].call(this, tipos_inputs);
        }
        if (b in TIPOS.tipoSalida) {
          let salida = TIPOS.tipoSalida[b];
          if (typeof salida == 'function') {
            salida = salida.call(this, tipos_inputs);
          }
          return salida;
        }
      };
    }
  }
};

TIPOS.tiposEsperados = function() {
  let lista_inputs = TIPOS.tiposInput[this.type] || [];
  if (typeof lista_inputs == 'function') {
    lista_inputs = lista_inputs.call(this);
  }
  let tipos_inputs = {};
  for (let i of lista_inputs) {
    let msgs = 'msg' in i ? i.msg : [];
    if (!Array.isArray(msgs)) { msgs = [msgs]; }
    msgs = msgs.map(x => x in TIPOS.Errores ? TIPOS.Errores[x] : x);
    if (i.t in TIPOS.verificacionesTipadoPorClave) {
      tipos_inputs[i.k] = TIPOS.verificacionesTipadoPorClave[i.t](this, i.k, msgs);
    } else {
      let tipo = i.t in TIPOS ? TIPOS[i.t] : i.t;
      tipos_inputs[i.k] = TIPOS.verificarTipoOperando(this, i.k, tipo, msgs[0]);
    }
  }
  return tipos_inputs;
};

/*
  Devuelve el tipo que espera el bloque dado en el input dado o:
  - Si espera un número (no importa si es ENTERO o FRACCION) devuelve
    el string NUMERO (que no es un id de tipo)
  - Si no espera ningún tipo en particular (por ejemplo las variables)
    devuelve undefined
  bloque : BlockSvg
  input_key : string
*/
TIPOS.tipoEsperado = function(bloque, input_key) {
  if (bloque.type in TIPOS.tiposInput) {
    let lista_inputs = TIPOS.tiposInput[bloque.type];
    if (typeof lista_inputs == 'function') {
      lista_inputs = lista_inputs.call(bloque);
    }
    for (let i of lista_inputs) {
      if (i.k == input_key) {
        return i.t in TIPOS ? TIPOS[i.t] : i.t;
      }
    }
  }
  /* algunos bloques puedem no tener tipo esperado
    * logic_compare (cuando la operación es == o !=)
    * text_join
    * text_prompt_ext
    * variables_set
    * variables_global_def
    * procedures_defreturn
    * lists_create_with
    * lists_repeat (el input ITEM)
    * lists_indexOf (el input FIND, que en realidad depende del input VALUE)
    * lists_setIndex (el input TO, que en realidad depende del input LIST)
  */
  return undefined;
};

// FUNCIONES DE TIPADO PARA CADA BLOQUE

TIPOS.tipoSalida = {
  logic_boolean: TIPOS.BINARIO,
  logic_operation: TIPOS.BINARIO,
  logic_negate: TIPOS.BINARIO,
  logic_ternary: function(tipos_inputs) {
    let tipo = TIPOS.operandosDelMismoTipo(this, ["THEN","ELSE"], TIPOS.Errores.OpsTernario, "TIPOS_EQ");
    if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
    return tipo;
  },
  logic_compare: TIPOS.BINARIO,
  math_number: function(tipos_inputs) {
    let tipo = TIPOS.identifyNumber(this.getFieldValue('NUM'));
    if (tipo) return tipo;
    // Si llego acá es porque el string es inválido pero eso no debería poder pasar
    // Por las dudas, devuelvo int
    return TIPOS.ENTERO;
  },
  math_arithmetic: function(t) {
    if (t.A) {
      if (TIPOS.fallo(t.A)) { return t.A; }
      if (t.B) {
        if (TIPOS.fallo(t.B)) { return t.B; }
        return TIPOS.unificar(t.A, t.B); // No puede fallar porque ambos unifican con entero
      }
      return t.A;
    } else if (t.B) {
      return t.B;
    }
    return TIPOS.ENTERO;
  },
  math_single: function(t) {
    if (["ABS","NEG"].includes(this.getFieldValue('OP'))) {
      if (t.NUM) { return t.NUM; }
      return TIPOS.ENTERO;
    }
    return TIPOS.FRACCION;
  },
  math_trig: TIPOS.FRACCION,
  math_constant: TIPOS.FRACCION,
  math_round: TIPOS.ENTERO,
  math_modulo: TIPOS.ENTERO,
  math_random_int: TIPOS.ENTERO,
  math_random_float: TIPOS.FRACCION,
  math_atan2: TIPOS.FRACCION,
  text: TIPOS.TEXTO,
  text_join: TIPOS.TEXTO,
  text_isEmpty: TIPOS.BINARIO,
  text_length: TIPOS.ENTERO,
  text_indexOf: TIPOS.ENTERO,
  text_charAt: TIPOS.CARACTER,
  text_getSubstring: TIPOS.TEXTO,
  text_changeCase: TIPOS.TEXTO,
  text_trim: TIPOS.TEXTO,
  text_prompt_ext: function(tipos_inputs) {
    return TIPOS[this.getFieldValue('TYPE')=="TEXT" ? 'TEXTO' : 'ENTERO'];
  },
  variables_get: function(tipos_inputs) {
    // si ya está en el mapa, retorno lo que está en el mapa
    // si no, creo una nueva variable fresca y la agrego al mapa
    let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
    return (tipoVariable === undefined) ? TIPOS.AUXVAR(this.id) : tipoVariable.tipo;
  },
  procedures_callreturn: function(tipos_inputs) {
    let id = Inferencia.obtenerIdFuncionBloque(this);
    if (id) return TIPOS.VAR(id);
    // Si llego acá hay un bloque procedures_call sin su procedures_def
    // Tengo que devolver algo para que no falle el algoritmo pero igual en
    // la próxima iteración este bloque va a desaparecer
    return TIPOS.AUXVAR(this.id);
  },
  math_on_list: function(t) {
    let op = this.getFieldValue('OP');
    let tipo = t.LIST === undefined
      ? TIPOS.LISTA(op=="RANDOM" ? TIPOS.AUXVAR(this.id) : TIPOS.ENTERO)
      : t.LIST;
    if (TIPOS.fallo(tipo)) { return tipo; }
    if (["AVERAGE", "STD_DEV"].includes(op)) {
      return TIPOS.FRACCION;
    }
    return tipo.alfa;
  },
  lists_repeat: function(tipos_inputs) {
    let tipoElem = Inferencia.tipo(this.getInputTargetBlock("ITEM"));
    if (tipoElem) {
      if (!TIPOS.fallo(tipoElem)) {
        return TIPOS.LISTA(tipoElem);
      }
    }
    return TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  },
  lists_length: TIPOS.ENTERO,
  lists_isEmpty: TIPOS.BINARIO,
  lists_getIndex: function(t) {
    let tipo = t.VALUE === undefined
      ? TIPOS.LISTA(TIPOS.AUXVAR(this.id))
      : t.VALUE;
    if (TIPOS.fallo(tipo)) { return tipo; }
    return tipo.alfa;
  },
  lists_getSublist: function(t) {
    return t.LIST === undefined
      ? TIPOS.LISTA(TIPOS.AUXVAR(this.id))
      : t.LIST;
  },
  lists_split: function(tipos_inputs) {
    let is_list = this.getFieldValue('MODE') == 'SPLIT';
    return is_list ? TIPOS.LISTA(TIPOS.TEXTO) : TIPOS.TEXTO;
  },
  lists_sort: function(t) {
    let is_numeric = this.getFieldValue('TYPE') == "NUMERIC";
    let tipo = t.LIST === undefined
      ? TIPOS.LISTA(TIPOS[is_numeric ? 'ENTERO' : 'TEXTO'])
      : t.LIST;
    return tipo;
  }
};

TIPOS.tiposInput = {
  logic_operation:[
    {k:'A', t:'BINARIO', msg:'BoolOp1'},
    {k:'B', t:'BINARIO', msg:'BoolOp2'}
  ],
  logic_negate: [{k:'BOOL', t:'BINARIO', msg:'BoolOp'}],
  logic_ternary: [{k:'IF', t:'BINARIO', msg:'BoolOp1'}],
  logic_compare: function() {
    let op = this.getFieldValue("OP");
    if (["EQ","NEQ"].includes(op)) {
      let tipo = TIPOS.operandosDelMismoTipo(this, ["A","B"], TIPOS.Errores.Op2, "TIPOS_EQ");
      Errores.VerificarComparacionEntreFloats(this, tipo);
      return [];
    }
    return [
      {k:'A', t:'NUMERO', msg:'NumOp1'},
      {k:'B', t:'NUMERO', msg:'NumOp2'}
    ];
  },
  controls_if: function() {
    let res = []; let n = 0;
    while(this.getInput('IF' + n)) {
      res.push({k:'IF' + n, t:'BINARIO', msg:'BoolCond'});
      n++;
    }
    return res;
  },
  controls_repeat_ext: [{k:'TIMES', t:'ENTERO', msg:['NumOp','IntOp']}],
  controls_whileUntil: [{k:'BOOL', t:'BINARIO', msg:'BoolCond'}],
  math_arithmetic: [
    {k:'A', t:'NUMERO', msg:'NumOp1'},
    {k:'B', t:'NUMERO', msg:'NumOp2'}
  ],
  math_single: [{k:'NUM', t:'NUMERO', msg:'NumOp'}],
  math_trig: [{k:'NUM', t:'NUMERO', msg:'NumOp'}],
  math_number_property: function() {
    if (this.getFieldValue('PROPERTY') == 'DIVISIBLE_BY') {
      Errores.verificarModuloCero(this);
      return [
        {k:'NUMBER_TO_CHECK', t:'ENTERO', msg:['NumOp1','IntOp1']},
        {k:'DIVISOR', t:'ENTERO', msg:['DivsNum','DivsInt']}
      ];
    }
    return [{k:'NUMBER_TO_CHECK', t:'NUMERO', msg:'NumOp'}]
  },
  math_round: [{k:'NUM', t:'NUMERO', msg:'NumOp'}],
  math_modulo: [
    {k:'DIVIDEND', t:'ENTERO', msg:['DivnNum','DivnInt']},
    {k:'DIVISOR', t:'ENTERO', msg:['DivsNum','DivsInt']}
  ],
  math_random_int: [
    {k:'FROM', t:'NUMERO', msg:'NumOp1'},
    {k:'TO', t:'NUMERO', msg:'NumOp2'}
  ],
  math_atan2: [
    {k:'X', t:'NUMERO', msg:'NumOp1'},
    {k:'Y', t:'NUMERO', msg:'NumOp2'}
  ],
  // text_isEmpty: [{k:'VALUE', t:'TEXTO', msg:'TextOp'}],
  // text_length: [{k:'VALUE', t:'TEXTO', msg:'TextOp'}],
  text_indexOf: [
      // {k:'VALUE', t:'TEXTO', msg:'TextOp1'},
      {k:'FIND', t:'TEXTO', msg:'TextOp2'}
  ],
  text_charAt: [
      // {k:'VALUE', t:'TEXTO', msg:'TextOp1'},
      {k:'AT', t:'ENTERO', msg:['NumOp2','IntOp2']}
  ],
  text_getSubstring: [
      // {k:'STRING', t:'TEXTO', msg:'TextOp1'},
      {k:'AT1', t:'ENTERO', msg:['NumOp2','IntOp2']},
      {k:'AT2', t:'ENTERO', msg:['NumOp3','IntOp3']}
  ],
  // text_changeCase: [{k:'TEXT', t:'TEXTO', msg:'TextOp'}],
  // text_trim: [{k:'TEXT', t:'TEXTO', msg:'TextOp'}],
  procedures_ifreturn: [{k:'CONDITION', t:'BINARIO', msg:'BoolCond'}],
  math_on_list: function() {
    let op = this.getFieldValue('OP');
    return [{k:'LIST',
      t:(op=="RANDOM")
        ? TIPOS.LISTA(TIPOS.AUXVAR(this.id))
        : TIPOS.LISTA(TIPOS.ENTERO),
      msg:(op=="RANDOM") ? 'ListOp' : 'ListNumOp'
    }];
  },
  lists_repeat: [{k:'NUM', t:'ENTERO', msg:['NumOp2','IntOp2']}],
  lists_length: function() {
    return [{k:'VALUE', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp'}];
  },
  lists_isEmpty: function() {
    return [{k:'VALUE', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp'}];
  },
  lists_getIndex: function() {
    return [
      {k:'VALUE', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp1'},
      {k:'AT', t:'ENTERO', msg:['NumOp2','IntOp2']}
    ];
  },
  lists_getSublist: function() {
    let posicionAt2 = 2;
    if (this.getInput('AT1') && this.getInput('AT1').type == Blockly.INPUT_VALUE) { posicionAt2 ++; }
    return [
      {k:'LIST', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp1'},
      {k:'AT1', t:'ENTERO', msg:['NumOp2','IntOp2']},
      {k:'AT2', t:'ENTERO', msg:[TIPOS.Errores.NumOpN(posicionAt2),TIPOS.Errores.IntOpN(posicionAt2)]}
    ];
  },
  lists_split: function() {
    let is_text = this.getFieldValue('MODE') == 'SPLIT';
    return [
      {k:'DELIM', t:'TEXTO', msg:'TextOp2'},
      {k:'INPUT',
        t:(is_text
          ? 'TEXTO'
          : TIPOS.LISTA(TIPOS.AUXVAR(this.id))
        ), msg:`${is_text ? 'Text' : 'List'}Op1`
      }
    ];
  },
  lists_sort: function() {
    let is_numeric = this.getFieldValue('TYPE') == "NUMERIC";
    return [{k:'LIST', t:TIPOS.LISTA(TIPOS[is_numeric ? 'ENTERO' : 'TEXTO']),
      msg:`List${is_numeric ? 'Num' : 'Text'}Op`
    }];
  }
  /* Los siguientes sólo los agrego para TIPOS.tipoEsperado porque la función
    de tipado se define aparte */
  ,
  controls_for: [
    {k:'FROM', t:'NUMERO', msg:'NumOp1'},
    {k:'TO', t:'NUMERO', msg:'NumOp2'},
    {k:'BY', t:'NUMERO', msg:'NumOp3'}
  ],
  controls_forEach: function() {
    return [{k:'LIST', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp'}];
  },
  lists_indexOf: function() {
    return [{k:'VALUE', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp1'}]
  },
  lists_setIndex: function() { return [
    {k:'LIST', t:TIPOS.LISTA(TIPOS.AUXVAR(this.id)), msg:'ListOp1'},
    {k:'AT', t:'ENTERO', msg:['NumOp2','IntOp2']}
  ];}
};

TIPOS.tipadoExtra = {
  controls_flow_statements: function(tipos_inputs) {
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
  },
  math_arithmetic: function(tipos_inputs) { Errores.verificarDivisionPorCero(this); },
  math_single: function(tipos_inputs) {
    let op = this.getFieldValue('OP');
    if (['LN','LOG10'].includes(op)) { Errores.VerificarLogaritmoPositivo(this); }
    else if (op == 'ROOT') { Errores.VerificarRaizNoNegativa(this); }
  },
  math_modulo: function(tipos_inputs) { Errores.verificarModuloCero(this); },
  variables_set: function(tipos_inputs) {
    let obj = Blockly.Msg.TIPOS_VARIABLE1;
    if (Inferencia.esUnArgumento(this.getField("VAR").getText(), this)) { obj = Blockly.Msg.TIPOS_ARGUMENTO1; }
    let v_id = Inferencia.obtenerIdVariableBloque(this);
    TIPOS.tipadoVariable(this, v_id, "VALUE", obj);
  },
  procedures_defreturn: function(tipos_inputs) {
    let v_id = Inferencia.obtenerIdFuncionBloque(this);
    TIPOS.tipadoVariable(this, v_id, "RETURN", Blockly.Msg.TIPOS_FUNCION1);
  },
  procedures_callnoreturn: function(tipos_inputs) {
    TIPOS.tiparArgumentosLlamado(this);
  },
  procedures_callreturn: function(tipos_inputs) {
    TIPOS.tiparArgumentosLlamado(this);
  },
  procedures_ifreturn: function(tipos_inputs) {
    let tope = Inferencia.topeScope(this);
    if (tope) {
      if (/*(tope.type == 'procedures_defnoreturn') || */(tope.type == 'procedures_defreturn')) {
        let v_id = Inferencia.obtenerIdFuncionBloque(tope);
        TIPOS.tipadoVariable(this, v_id, "VALUE", Blockly.Msg.TIPOS_FUNCION1);
      } else {
        Inferencia.advertencia(this, "PARENT", Blockly.Msg.TIPOS_ERROR_PARENT_FUN);
      }
    }
  }
};

// repetición con iterador
Blockly.Blocks['controls_for'].tipado = function() {
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  let tipoInicial = TIPOS.verificarTipoOperando(this, 'FROM', TIPOS.ENTERO, TIPOS.Errores.NumOp1);
  TIPOS.verificarTipoOperando(this, 'TO', TIPOS.ENTERO, TIPOS.Errores.NumOp2);
  let tipoPaso = TIPOS.verificarTipoOperando(this, 'BY', TIPOS.ENTERO, TIPOS.Errores.NumOp3);
  if (tipoVariable === undefined) { return; }
  tipoVariable = tipoVariable.tipo;
  if (TIPOS.fallo(tipoVariable)) { return; }
  let tipoIterador = TIPOS.ENTERO;
  if ((tipoInicial && !TIPOS.fallo(tipoInicial) && tipoInicial.id == "FRACCION") || (tipoPaso && !TIPOS.fallo(tipoPaso) && tipoPaso.id == "FRACCION")) {
    tipoIterador = TIPOS.FRACCION;
  }
  TIPOS.tipadoVariable(this, Inferencia.obtenerIdVariableBloque(this), tipoIterador, Blockly.Msg.TIPOS_VARIABLE1);
};

// repetición en lista
Blockly.Blocks['controls_forEach'].tipado = function() {
  let tipoVariable = Inferencia.agregarVariableAlMapa(this.getField('VAR').getText(), this, "VAR", false);
  let tipoOperando = TIPOS.verificarTipoOperando(this, 'LIST', TIPOS.LISTA(TIPOS.AUXVAR(this.id)), TIPOS.Errores.ListOp);
  if (TIPOS.fallo(tipoOperando)) { return; }
  if (tipoVariable === undefined) { return; }
  tipoVariable = tipoVariable.tipo;
  if (TIPOS.fallo(tipoVariable)) { return; }
  if (tipoOperando) {
    let alfa = tipoOperando.alfa;
    TIPOS.tipadoVariable(this, Inferencia.obtenerIdVariableBloque(this), alfa, Blockly.Msg.TIPOS_VARIABLE1);
  }
};

TIPOS.tipadoVariable = function(bloque, v_id, argumento_o_tipo, obj) {
  if (v_id in Inferencia.mapa_de_variables) {
    let mapa = Inferencia.mapa_de_variables[v_id];
    let tipoAnterior = mapa.tipo;
    let fallaAnterior = TIPOS.fallo(tipoAnterior);
    if (fallaAnterior) {
      if (tipoAnterior.idError == "INCOMPATIBLES") {
        tipoAnterior = tipoAnterior.sugerido;
      } else { return; }
    }
    let tipo = argumento_o_tipo;
    if (typeof argumento_o_tipo == 'string') {
      let bloqueArgumento = bloque.getInputTargetBlock(argumento_o_tipo);
      tipo = Inferencia.tipo(bloqueArgumento);
    }
    if (tipo) {
      if (TIPOS.fallo(tipo)) {
        if (!fallaAnterior) { mapa.tipo = TIPOS.DIFERIDO(tipo); }
      } else {
        let unificacion = TIPOS.unificar(tipoAnterior, tipo);
        if (TIPOS.fallo(unificacion)) {
          Inferencia.error(bloque, "TIPOS_VAREQ", TIPOS.Errores.Incompatibles(obj, mapa.nombre_original, tipoAnterior.str1(), tipo.str1()));
        }
        if (!fallaAnterior) {
          for (let i of TIPOS.variablesEn(unificacion)) {
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

delete Blockly.Blocks['procedures_ifreturn'].onchange;

// bloque de lista
// si todos los elementos son de tipos unificables, retorno lista de tal tipo
Blockly.Blocks['lists_create_with'].tipado = function() {
  let inputs = []
  for (let i=0; i<this.itemCount_; i++) {
    inputs.push("ADD"+i);
  }
  let tipo = TIPOS.operandosDelMismoTipo(this, inputs, TIPOS.Errores.OpsList, "TIPOS_EQ");
  if (tipo===undefined) tipo = TIPOS.AUXVAR(this.id);
  if (TIPOS.fallo(tipo)) { return TIPOS.DIFERIDO(tipo); }
  return TIPOS.LISTA(tipo);
};

// Índice de elemento en lista
Blockly.Blocks['lists_indexOf'].tipado = function() {
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "VALUE", tipoLista, TIPOS.Errores.ListOp1);
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  let tipoAlfaUnificado = TIPOS.verificarTipoOperando(this, 'FIND', tipoListaUnificado.alfa, TIPOS.Errores.AlfaOp2(tipoListaUnificado.alfa));
  /*Parece que no hace falta:
  if (tipoAlfaUnificado && !TIPOS.fallo(tipoAlfaUnificado) && TIPOS.distintos(tipoAlfaUnificado, tipoListaUnificado.alfa)) {
    TIPOS.verificarTipoOperando(this, "VALUE", TIPOS.LISTA(tipoAlfaUnificado), TIPOS.Errores.ListOp1);
  }*/
  return TIPOS.ENTERO;
};

Blockly.Blocks['lists_setIndex'].tipado = function() {
  TIPOS.verificarTipoOperandoEntero(this, 'AT', TIPOS.Errores.NumOp2, TIPOS.Errores.IntOp2);
  let tipoLista = TIPOS.LISTA(TIPOS.AUXVAR(this.id));
  let tipoListaUnificado = TIPOS.verificarTipoOperando(this, "LIST", tipoLista, TIPOS.Errores.ListOp1);
  if (tipoListaUnificado===undefined) { tipoListaUnificado=tipoLista; }
  if (TIPOS.fallo(tipoListaUnificado)) { return tipoListaUnificado; }
  let modo = this.getFieldValue('MODE');
  let tipoAlfaUnificado = TIPOS.verificarTipoOperando(this, 'TO', tipoListaUnificado.alfa, TIPOS.Errores.AlfaModo(tipoListaUnificado.alfa, modo));
  /*Parece que no hace falta:
  if (tipoAlfaUnificado && !TIPOS.fallo(tipoAlfaUnificado) && TIPOS.distintos(tipoAlfaUnificado, tipoListaUnificado.alfa)) {
    TIPOS.verificarTipoOperando(this, "LIST", TIPOS.LISTA(tipoAlfaUnificado), TIPOS.Errores.ListOp1);
  }*/
};

TIPOS.agregarBloqueVariableGlobal = function() {
  Blockly.Blocks['variables_global_def'].variableLibre = function(global) {
    if (global && Main.modo_variables != Inferencia.LOCALES) {
      let nombre = this.getField('VAR').getText();
      Inferencia.agregarVariableAlMapa(nombre, this, "VAR", true);
    }
  };

  Blockly.Blocks['variables_global_def'].tipado = Blockly.Blocks['variables_set'].tipado;
}
