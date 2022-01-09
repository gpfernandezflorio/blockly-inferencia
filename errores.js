Errores = {
  datos: {"ERR":{
    // Estos se eliminan sólos y no tengo que tocarlos yo:
    manuales: {},
    // Estos debo quitarlos cada vez a menos que se vuelvan a generar
    automaticos: {},
    // Otros datos...
    campo: "error",
    funcionBlockly: "setErrorText",
    titulo: "ERROR"
  }, "WRN":{
    // Estos se eliminan sólos y no tengo que tocarlos yo:
    manuales: {},
    // Estos debo quitarlos cada vez a menos que se vuelvan a generar
    automaticos: {},
    // Otros datos...
    campo: "warning",
    funcionBlockly: "setWarningText",
    titulo: "WARNING"
  }}
};

// Me guardo los errores actuales para no borrarlos
Errores.recolectarErroresYAdvertencias = function(ws) {
  Errores.recoleccionGenerica(ws, "ERR");
  Errores.recoleccionGenerica(ws, "WRN");
};

Errores.recoleccionGenerica = function(ws, clave) {
  const datos = Errores.datos[clave];
  datos.automaticos = {};
  for (bloque of ws.getAllBlocks()) {
    if (bloque[datos.campo]) {
      let b_id = bloque.id;
      for (tag in bloque[datos.campo].text_) {
        // Primero me fijo si es uno que se borra a mano
        if ((!(b_id in datos.manuales)) || (!(tag in datos.manuales[b_id]))) {
          // Si no es así, lo marco para eliminar
          if (b_id in datos.automaticos) {
            datos.automaticos[b_id][tag] = {'texto':bloque[datos.campo].text_[tag],'d':true};
          } else {
            datos.automaticos[b_id] = {[tag]: {'texto':bloque[datos.campo].text_[tag],'d':true}};
          }
        }
      }
    }
  }
};

// Borro los errores que no hayan sido marcados
Errores.quitarErroresYAdvertenciasObsoletos = function(ws) {
  Errores.quitarGenerico(ws, "ERR");
  Errores.quitarGenerico(ws, "WRN");
};

Errores.quitarGenerico = function(ws, clave) {
  const datos = Errores.datos[clave];
  for (b_id in datos.automaticos) {
    for (tag in datos.automaticos[b_id]) {
      if (datos.automaticos[b_id][tag].d) {
        let bloque = ws.getBlockById(b_id);
        if (bloque) { bloque[datos.funcionBlockly](null, tag); }
      }
    }
  }
};

Errores.error = function(bloque, tag, mensaje, manual=false) {
  Errores.msgGenerico("ERR", bloque, tag, mensaje, manual);
};

Errores.advertencia = function(bloque, tag, mensaje, manual=false) {
  Errores.msgGenerico("WRN", bloque, tag, mensaje, manual);
};

// tag es string pero mensaje puede ser string o lista de strings
Errores.msgGenerico = function(clave, bloque, tag, mensaje, manual) {
  if (bloque.disabled) {
    if (manual) {
      bloque.setErrorText(null);
      bloque.setWarningText(null);
    }
    return;
  }
  if (typeof(mensaje)=="string") { Errores.msgGenerico(clave, bloque, tag, mensaje.split("\n"), manual); }
  else if (Array.isArray(mensaje)) {
    mensaje[0] = Errores.armarMsg(clave, mensaje[0])
    if (mensaje.length == 1) {
      Errores.msgBloqueGenerico(clave, bloque, tag, mensaje[0], manual);
    } else {
      let i = 0;
      for (msg of mensaje) {
        i++;
        Errores.msgBloqueGenerico(clave, bloque, tag + " - "+i, msg, manual);
      }
    }
  }
};

Errores.armarMsg = function(clave, mensaje) {
  return Blockly.Msg["TIPOS_"+Errores.datos[clave].titulo] + ": " + mensaje;
}

// tag y mensaje son strings
// Si el error ya existe, lo marco. Si no, lo agrego
// Si es manual, lo ignoro cuando quito los obsoletos
Errores.msgBloqueGenerico = function(clave, bloque, tag, mensaje, manual) {
  const datos = Errores.datos[clave];
  if (manual) {
    if (bloque.id in datos.manuales) {
      if (tag in datos.manuales[bloque.id]) {
        if (mensaje === null) { delete datos.manuales[bloque.id][tag]; }
        else if (mensaje != datos.manuales[bloque.id][tag]) {
          datos.manuales[bloque.id][tag] = mensaje;
        }
      } else if (mensaje !== null) {
        datos.manuales[bloque.id][tag] = mensaje;
      }
    } else if (mensaje !== null) {
      datos.manuales[bloque.id] = {tag: mensaje};
    }
  } else if (bloque.id in datos.automaticos) {
    if (tag in datos.automaticos[bloque.id]) {
      datos.automaticos[bloque.id][tag].d = false;
      if (datos.automaticos[bloque.id][tag].texto != mensaje) {
        bloque[datos.funcionBlockly](mensaje, tag);
      }
      return;
    }
  }
  bloque[datos.funcionBlockly](mensaje, tag);
  if (bloque.rendered && bloque[datos.campo]) {
    bloque[datos.campo].setVisible(true);
  }
};

Errores.VerificarComparacionEntreFloats = function(bloque, tipo) {
  if (tipo && (tipo.id == "FRACCION")) {
    Inferencia.advertencia(bloque, "MATH_FLOAT_EQ", Blockly.Msg.TIPOS_ERROR_FLOAT_EQ);
  }
};

Errores.verificarDivisionPorCero = function(bloque) {
  let divisor = bloque.getInputTargetBlock("B");
  if (divisor && bloque.getFieldValue('OP') == "DIVIDE" &&
    divisor.type == "math_number" && bloque.getFieldValue("NUM") == "0") {
      Inferencia.advertencia(bloque, "MATH_ZERO_DIV", Blockly.Msg.TIPOS_ERROR_ZERO_DIV);
    }
};

Errores.VerificarLogaritmoPositivo = function(bloque) {
  let operando = bloque.getInputTargetBlock("NUM");
  if (operando) {
    if (operando.type == "math_number") {
      if (operando.getFieldValue("NUM") == 0) {
        Inferencia.advertencia(bloque, "MATH_ZERO_LOG", Blockly.Msg.TIPOS_ERROR_ZERO_LOG);
      } else if (String(operando.getFieldValue("NUM")).startsWith("-")) {
        Inferencia.advertencia(bloque, "MATH_NEG_LOG", Blockly.Msg.TIPOS_ERROR_NEG_LOG);
      }
    } else if (operando.type == "math_single" && operando.getFieldValue('OP') == "NEG") {
      operando = operando.getInputTargetBlock("NUM");
      if (operando) {
        if (operando.type == "math_number") {
          if (operando.getFieldValue("NUM") == 0) {
            Inferencia.advertencia(bloque, "MATH_ZERO_LOG", Blockly.Msg.TIPOS_ERROR_ZERO_LOG);
          } else if (!String(operando.getFieldValue("NUM")).startsWith("-")) {
            Inferencia.advertencia(bloque, "MATH_NEG_LOG", Blockly.Msg.TIPOS_ERROR_NEG_LOG);
          }
        }
      } else {
        Inferencia.advertencia(bloque, "MATH_NEG_LOG", Blockly.Msg.TIPOS_ERROR_NEG_LOG);
      }
    }
  }
};
