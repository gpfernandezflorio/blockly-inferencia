Testing = { intervalo: 2000, MODO_INTERVALO: 0, MODO_INMEDIATO: 1, MODO_INTERACTIVO:2 };

Testing.modo = Testing.MODO_INTERACTIVO;

Testing.iniciar = function() {
  if (Testing.proximo === undefined) {
    document.getElementById('boton_proximoTest').disabled = false;
    document.getElementById('boton_anteriorTest').disabled = true;
    Testing.proximo = 0;
  }
};

Testing.proximoTest = function(f) {
  if (Testing.proximo !== undefined && Testing.proximo < Testing.tests.length) {
    Testing.ejecutarTest(Testing.tests[Testing.proximo], function(resultado) {
      if (Testing.proximo == Testing.tests.length) {
        document.getElementById('boton_proximoTest').disabled = true;
        resultado.esElUltimo = true;
      };
      f(resultado);
      if (Testing.proximo > 0) {
        document.getElementById('boton_anteriorTest').disabled = false;
      }
    });
  } else {
    f({fail: true});
  }
};

Testing.finalizar = function() {
  delete Testing.proximo;
  document.getElementById('boton_proximoTest').disabled = false;
  document.getElementById('boton_anteriorTest').disabled = true;
};

Testing.ejecutarTest = function(test, f) {
  let resultado = {
    nombre: test.nombre
  };
  Main.prepararTest(test, function() {
    let exito = true;
    let mensajes = [];
    // Variables encontradas
    let variables_encontradas = [];
    for (let v in Inferencia.mapa_de_variables) {
      let variable_encontrada = Inferencia.mapa_de_variables[v];
      let nombre = variable_encontrada.nombre_original;
      variables_encontradas.push(nombre);
      let variable_esperada = test.resultado[nombre];
      if (variable_esperada) {
        if (['MAIN', 'GLOBAL'].includes(variable_esperada.scope)) {
          if (variable_encontrada.scope.id_s != variable_esperada.scope) {
            exito = false;
            mensajes.push(`Se esperaba que la variable "${nombre}" pertenezca al scope "${variable_esperada.scope}" pero en su lugar se la encontró en el scope "${variable_encontrada.scope.id_s}".`);
          }
        }
        // TODO: OTROS SCOPES
        if (TIPOS.distintos(variable_encontrada.tipo, variable_esperada.tipo)) {
          exito = false;
          mensajes.push(`Se esperaba que la variable "${nombre}" se infiera con el tipo "${variable_esperada.tipo.str()}" pero en su lugar se le infirió el tipo "${variable_encontrada.tipo.str()}".`);
        }
      } else {
        exito = false;
        mensajes.push(`Se detectó la variable "${nombre}" que no se esperaba encontrar.`);
      }
    }
    for (let v in test.resultado) {
      if (!variables_encontradas.includes(v)) {
        mensajes.push(`Se esperaba encontrar la variable "${v}" pero no se encontró.`);
      }
    }
    for (let e in test.errores) {
      if (e in Main.erroresYAdvertencias) {
        for (let error_esperado of test.errores[e]) {
          if (!Testing.errorEncontrado(Errores.armarMsg('ERR', error_esperado.msg), Main.erroresYAdvertencias[e].errores)) {
            exito = false;
            mensajes.push(`Se esperaba que el bloque "${e}" detonara el error "${error_esperado.msg}"`);
          }
        }
      } else {
        exito = false;
        mensajes.push(`Se esperaba que el bloque "${e}" detonara los siguientes errores:`);
        for (let m of test.errores[e]) {
          mensajes.push(`  * "${m.msg}"`);
        }
      }
    }
    for (let e in Main.erroresYAdvertencias) {
      if (e in test.errores) {
      } else {
        exito = false;
        mensajes.push(`Se esperaba que el bloque "${e}" no detonara ningún error pero detonó los siguientes:`);
        for (let m of Main.erroresYAdvertencias[e].errores) {
          mensajes.push(`  * "${m.msg}"`);
        }
      }
    }
    resultado.exito = exito;
    resultado.mensajes = mensajes;
    f(resultado);
  });
};

Testing.errorEncontrado = function(error_esperado, errores_encontrados) {
  for (let error_encontrado of errores_encontrados) {
    if (error_esperado == error_encontrado.mensaje) {
      return true;
    }
  }
  return false;
}
