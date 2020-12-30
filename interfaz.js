Main.mostrarMapa = function() {
  let res = "<h4>Resultado</h4>";
  const variables_main = [];
  const variables_locales = [];
  const variables_globales = [];
  const funciones = [];
  for (v_id in Inferencia.mapa_de_variables) {
    let mapa = Inferencia.mapa_de_variables[v_id];
    let scope = mapa.scope;
    if (scope.id_s=="GLOBAL") {
      if (v_id.startsWith("VAR")) {variables_globales.push(mapa);}
      else {funciones.push(mapa);}
    } else if (scope.id_s.startsWith("MAIN")) {
      variables_main.push(mapa);
    } else {
      variables_locales.push(mapa);
    }
  }
  if (variables_main.length || variables_locales.length) {
    res += "<h5>Variables locales</h5>"
    res += "<table id='t01'><tr><th>scope</th><th>variable</th><th>tipo inferido</th></tr>";
    for (mapa of variables_main.concat(variables_locales)) {
      let scope = mapa.scope;
      if (scope) {
        scope =  scope.nombre_original + " ";
      } else {
        scope = " ";
      }
      res += "<tr><td>" + scope + "</td><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  if (variables_globales.length) {
    res += "<h5>Variables globales</h5>"
    res += "<table id='t01'><tr><th>variable</th><th>tipo inferido</th></tr>";
    for (mapa of variables_globales) {
      res += "<tr><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  if (funciones.length) {
    res += "<h5>Funciones</h5>"
    res += "<table id='t01'><tr><th>función</th><th>tipo inferido</th></tr>";
    for (mapa of funciones) {
      res += "<tr><td>" + mapa.nombre_original + "</td><td>" + TIPOS.str(mapa.tipo) + "</td></tr>";
    }
    res += "</table>";
  }
  document.getElementById("resultado").innerHTML = res;
};

// Inicia la ejecución
Main.ejecutar = function() {
  if (!Main.procesando) {
    Main.procesando = true;
    setTimeout(function() {
      delete Main.procesando;
      Main.recolectarErrores();
      Inferencia.crearMapaDeVariables(Main.workspace);
      Main.mostrarMapa();
      //const codigo = Main.generador.workspaceToCode(Main.workspace);
      //console.log(codigo);
      Main.quitarErroresObsoletos();
    }, 200); // La interfaz tarda un poco en actualizarse
  }
};

const bloques_superiores = [
  "main", "procedures_defreturn", "procedures_defnoreturn",
  "ultrasonic_setup", "joystick_setup", "keypad_setup", "color_setup",
  "h_bridge_setup", "h_bridge_setup_pid", "stepper_setup", "lcd_setup",
  "spi_setup", "remote_setup", "remote_setup_custom",
  "event_period", "event_condition",
  "event_ultrasonic", "event_ldr_analog", "event_ldr", "event_pir",
  "event_joystick_axis_change", "event_joystick_axis_limit", "event_keypad",
  "event_remote","define_def", "variables_global_def"
];
