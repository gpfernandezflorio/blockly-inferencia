const Main = {modo_variables : "LOCALES"};

// Posibles valores para los argumentos que vienen en la URL
  // El primero es el valor por defecto
Main.argumentosValidos = {
  idioma:['es','en']
}

// Inicializa todo lo necesario antes de que se termine de cargar la página
Main.preCarga = function() {
  // Esto se debe hacer antes de cargar la página ya que hay que incrustar los archivos en el documento
  Main.agregarFuentesBlockly(); // según si se usa la versión comprimida o sin comprimir
  Main.cargarIdioma();          // en base al argumento 'idioma' en la url
}

// Importa todos los archivos necesarios de Blockly
Main.agregarFuentesBlockly = function() {
  if (version_comprimida) {
    Main.agregarScriptFuente('blockly/blockly_compressed.js');        // Blockly comprimido
    Main.agregarScriptFuente('blockly/blocks_compressed.js');         // Bloques comprimidos
    Main.agregarScriptFuente('blockly/javascript_compressed.js');     // Generador comprimido
  } else {
    Main.agregarScriptFuente('blockly/blockly_uncompressed.js');      // Blockly sin comprimir
    Main.agregarScriptFuente('blockly/generators/javascript.js');     // Generador base
    const archivosBloques = ["logic","loops","math","text","lists","colour","variables","procedures"];
    for (archivo of archivosBloques) {
      Main.agregarScriptFuente(`blockly/blocks/${archivo}.js`);                // Bloques sin comprimir
      Main.agregarScriptFuente(`blockly/generators/javascript/${archivo}.js`); // y sus funciones generadoras
    }
  }
};

// Determina el idioma actual y lo guarda en Main.idioma
Main.cargarIdioma = function() {
  Main.idioma = Main.argumentoURL('idioma');
  Main.agregarScriptFuente(`blockly/msg/js/${Main.idioma}.js`); // Carga archivo de idioma de Blockly
};

// Inicializa todo lo necesario una vez que se termina de cargar la página
Main.inicializar = function() {
  Main.agregarBloquesCustom();
  Main.div = document.getElementById('blockly');
  Main.inyectarBlockly();   // Inyectar la interfaz de Blockly
  Main.registrarEventos();  // Registrar handlers para eventos
  Main.redimensionar();     // Llamo a esta función para que ajuste el tamaño al iniciar
  if (false) {
    Blockly.Xml.domToWorkspace(
    Blockly.Xml.textToDom('<xml><variables><variable id="or(Q;=|s{/2^#++KP]d8">x</variable><variable id="%j!Ik%!rO,[@}Xg;{Y/~">y</variable></variables><block type="procedures_defnoreturn" id="Xt7V{lS|vOwh*H^{Qv!v" x="291" y="82"><mutation><arg name="x" varid="or(Q;=|s{/2^#++KP]d8"></arg><arg name="y" varid="%j!Ik%!rO,[@}Xg;{Y/~"></arg></mutation><field name="NAME">hola</field><comment pinned="false" h="80" w="160">Describe esta función...</comment><statement name="STACK"><block type="variables_set" id="X*H1W(/LXai4:*BH65B]"><field name="VAR" id="or(Q;=|s{/2^#++KP]d8">x</field><value name="VALUE"><block type="math_number" id="nm6GZ`!phiU80nKF.*U0"><field name="NUM">123</field></block></value><next><block type="variables_set" id="yw5:V^5Oi2S7h#*kSp7["><field name="VAR" id="or(Q;=|s{/2^#++KP]d8">x</field><value name="VALUE"><block type="math_number" id="VqgPI0!fvmt2`b*#U.fS"><field name="NUM">123</field></block></value></block></next></block></statement></block><block type="procedures_defnoreturn" id="BHr`nq3c2rMb6hu0uT)V" x="50" y="188"><mutation><arg name="x" varid="or(Q;=|s{/2^#++KP]d8"></arg><arg name="y" varid="%j!Ik%!rO,[@}Xg;{Y/~"></arg></mutation><field name="NAME">chau</field><comment pinned="false" h="80" w="160">Describe esta función...</comment></block><block type="main" id="MAIN" x="76" y="266"><statement name="LOOP"><block type="procedures_callnoreturn" id="qRa{|[gI#Bs3,*u.~yEy"><mutation name="hola"><arg name="x"></arg><arg name="y"></arg></mutation><value name="ARG0"><block type="logic_boolean" id="jh1y|}lQ/pg%v_B,35gX"><field name="BOOL">TRUE</field></block></value></block></statement></block><block type="variables_set" id="nR,+Az;RsneJYFmX6_yx" x="418" y="250"><field name="VAR" id="or(Q;=|s{/2^#++KP]d8">x</field><value name="VALUE"><block type="logic_boolean" id="kAR1GJtL?yA*2_2uP-P:"><field name="BOOL">TRUE</field></block></value></block><block type="logic_boolean" id="3YJ6B#oG!Ec2w?_LlgEO" x="255" y="443"><field name="BOOL">TRUE</field></block></xml>'),
    Main.workspace);
  } else {
    var childBlock = Main.workspace.newBlock("main", "MAIN");
    childBlock.initSvg();
    childBlock.render();
    childBlock.moveBy(50,50);
  }
  Main.ejecutar();
};

Main.agregarBloquesCustom = function() {
  Main.generador = Blockly.JavaScript;

  Blockly.defineBlocksWithJsonArray([  // BEGIN JSON EXTRACT
    {
      "type": "main",
      "message0": "MAIN",
      "args0": [],
      "message1": "%1",
      "style": "procedure_blocks",
      "args1": [{"type":"input_statement","name":"LOOP"}],
      "inputsInline": false
    },
    {
      "type": "variables_global_def",
      "message0": "%{BKY_VARIABLES_SET}",
      "args0": [
        {
          "type": "field_variable",
          "name": "VAR",
          "variable": "%{BKY_VARIABLES_DEFAULT_NAME}"
        },
        {
          "type": "input_value",
          "name": "VALUE"
        }
      ],
      "style": "variable_blocks",
      "tooltip": "%{BKY_VARIABLES_SET_TOOLTIP}",
      "helpUrl": "%{BKY_VARIABLES_SET_HELPURL}",
      "extensions": ["contextMenu_variableSetterGetter"]
    }
  ]);  // END JSON EXTRACT (Do not delete this comment.)

  Main.generador['main'] = function(block) {
    var mainBranch = Main.generador.statementToCode(block, 'LOOP');
    return mainBranch;
  };

  Main.generador['variables_global_def'] = function(block) {
    return '';
  };

  TIPOS.inicializar();
}

// Inyecta la interfaz Blockly en la div con id "blockly" y guarda el resultado en Main.workspace
Main.inyectarBlockly = function() {
  toolbox = document.getElementById('toolbox').outerHTML;
  // Toma como segundo argumento un objeto de configuración
  Main.workspace = Blockly.inject('blockly', {toolbox: toolbox});
};

// Registra handlers para todos los eventos
Main.registrarEventos = function () {
  Main.workspace.addChangeListener(function(event) {
    if (event.type == Blockly.Events.BLOCK_CREATE) {
      // Elimino los chequeos de tipo
      for (b_id of event.ids) {
        let bloque = Main.workspace.getBlockById(b_id);
        if (bloque.outputConnection) { bloque.outputConnection.setCheck(null); }
        for (input of bloque.inputList) {
          if (input.connection) {
            input.setCheck(null);
          }
        }
      }
    }
    if (event.type == Blockly.Events.BLOCK_CHANGE) {
      // Si es un campo de texto programo el cambio para más adelante
      if (event.element=="field") {
        if (!Main.procesando) {
          Main.procesando = true;
          const f = function() {
            let bloque = Main.workspace.getBlockById(event.blockId);
            let campo = bloque.getField(event.name);
            if (campo.isBeingEdited_) {
              setTimeout(f, 500);
            } else {
              delete Main.procesando;
              Main.ejecutar();
            }
          }
          setTimeout(f, 500);
        }
      }
    }
    if (Blockly.Events.BLOCK_MOVE && Main.workspace.isDragging()) { return; }
    if (!Main.procesando && event.type != Blockly.Events.UI) {
      Main.ejecutar();
    }
  });
  window.addEventListener('resize', Main.redimensionar, false);   // Al cambiar el tamaño de la pantalla
};

// Esta función se ejecuta cada vez que cambia el tamaño de la ventana del navegador
//  (y una vez cuando se inicializa la página)
Main.redimensionar = function() {
  Main.div.style.height = `${window.innerHeight-35}px`;
  Main.div.style.width = `${7*window.innerWidth/10-10}px`;
  Blockly.svgResize(Main.workspace);
};

// Obtiene argumentos de la url (?key=valor)
// Si no se encuentra o si no es uno de los válidos, devuelve el valor por defecto
Main.argumentoURL = function(key) {
  let valor = location.search.match(new RegExp('[?&]' + key + '=([^&]+)'));
  const validos = Main.argumentosValidos[key];
  const defecto = validos[0];
  if (valor) {
    valor = decodeURIComponent(valor[1].replace(/\+/g, '%20'));
    if (!validos.includes(valor)) {
      valor = defecto;
    }
  } else {
    valor = defecto;
  }
  return valor
};

// Agrega un script al documento
Main.agregarScriptFuente = function(ruta) {
  document.write(`<script src="${ruta}"></script>\n`);
};

Main.opcion_variables = function() {
  let opt = document.getElementById("opcion_variables").value;
  if (opt == "Sólo locales") {
    Main.modo_variables = "LOCALES";
  } else if (opt == "Sólo globales") {
    Main.modo_variables = "GLOBALES";
  } else {
    Main.modo_variables = "AMBAS";
  }
  Main.ejecutar();
}

// Me guardo los errores actuales para no borrarlos
Main.recolectarErrores = function() {
  Main.baseDeErrores = {};
  for (bloque of Main.workspace.getAllBlocks()) {
    if (bloque.warning) {
      let b_id = bloque.id;
      for (tag in bloque.warning.text_) {
        if (b_id in Main.baseDeErrores) {
          Main.baseDeErrores[b_id][tag] = {'texto':bloque.warning.text_[tag],'d':true};
        } else {
          Main.baseDeErrores[b_id] = {[tag]: {'texto':bloque.warning.text_[tag],'d':true}}
        }
      }
    }
  }
};

// Borro los errores que no hayan sido marcados
Main.quitarErroresObsoletos = function() {
  for (b_id in Main.baseDeErrores) {
    for (tag in Main.baseDeErrores[b_id]) {
      if (Main.baseDeErrores[b_id][tag].d) {
        let bloque = Main.workspace.getBlockById(b_id);
        bloque.setWarningText(null, tag);
      }
    }
  }
};

// Si el error ya existe, lo marco. Si no, lo agrego
Main.error = function(bloque, tag, mensaje) {
  if (bloque.id in Main.baseDeErrores) {
    if (tag in Main.baseDeErrores[bloque.id]) {
      Main.baseDeErrores[bloque.id][tag].d = false;
      if (Main.baseDeErrores[bloque.id][tag].texto != mensaje) {
        bloque.setWarningText(mensaje, tag);
      }
      return;
    }
  }
  bloque.setWarningText(mensaje, tag);
  bloque.warning.setVisible(true);
};

// Antes de terminar de cargar la página, llamo a esta función
Main.preCarga();

// Cuando se termina de cargar la página, llamo a inicializar
window.addEventListener('load', Main.inicializar);
