const Main = {};

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
  Main.agregarScriptFuente('errorIcon.js'); // Agrego los errores de AppInventor
};

// Determina el idioma actual y lo guarda en Main.idioma
Main.cargarIdioma = function() {
  Main.idioma = Main.argumentoURL('idioma');
  Main.agregarScriptFuente(`blockly/msg/js/${Main.idioma}.js`); // Carga archivo de idioma de Blockly
  Main.agregarScriptFuente(`msg/${Main.idioma}.js`); // Carga archivo de idioma de Blockly
};

// Inicializa todo lo necesario una vez que se termina de cargar la página
Main.inicializar = function() {
  Main.completarInterfaz();
  Main.modo_variables = Inferencia.LOCALES;
  Main.agregarBloquesCustom();
  Main.div = document.getElementById('blockly');
  Main.inyectarBlockly();   // Inyectar la interfaz de Blockly
  Main.registrarEventos();  // Registrar handlers para eventos
  Main.redimensionar();     // Llamo a esta función para que ajuste el tamaño al iniciar
  if (false) {
    Blockly.Xml.domToWorkspace(
    Blockly.Xml.textToDom('<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="7h]I5HuafV}[LGB[p39x">elemento</variable></variables><block type="main" id="MAIN" x="115" y="216"><statement name="LOOP"><block type="variables_set" id="4HcxWX;s|w0PXx;~xtfl"><field name="VAR" id="7h]I5HuafV}[LGB[p39x">elemento</field><value name="VALUE"><block type="text" id="J8{^H]XvBY+%(488`S`V"><field name="TEXT"></field></block></value><next><block type="controls_if" id="D9m3qnDE0Ye?g8|d4Vps"><value name="IF0"><block type="math_number_property" id="kgZ!le#MfY$D1vi%rG/E"><mutation divisor_input="false"></mutation><field name="PROPERTY">EVEN</field><value name="NUMBER_TO_CHECK"><shadow type="math_number" id="]/D.DLdW88TzbUmcLqbr"><field name="NUM">0</field></shadow><block type="math_arithmetic" id="]Js0ahOg8Ou$.l~|+4aX"><field name="OP">ADD</field><value name="A"><shadow type="math_number" id="8q%/2J9YP.1hzUB3?#/e"><field name="NUM">1</field></shadow></value><value name="B"><shadow type="math_number" id="@5*nyE{)wdT]T#2[ca7*"><field name="NUM">1</field></shadow><block type="variables_get" id="0-12k^03KCsB@TAE[dHv"><field name="VAR" id="7h]I5HuafV}[LGB[p39x">elemento</field></block></value></block></value></block></value></block></next></block></statement></block></xml>'),
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

  Blockly.Blocks['variables_global_def'].variableLibre = function(global) {
    if (global && Main.modo_variables != Inferencia.LOCALES) {
      let nombre = this.getField('VAR').getText();
      Inferencia.agregarVariableAlMapa(nombre, this, "VAR", true);
    }
  };

  delete Blockly.Constants.Loops.CONTROL_FLOW_IN_LOOP_CHECK_MIXIN.onchange;

  Inferencia.inicializar({
    bloquesSuperiores: bloques_superiores,
    error: Errores.error,
    advertencia: Errores.advertencia,
    modo_variables: function() { return Main.modo_variables; }
  });
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
        if (bloque) {
          if (bloque.outputConnection) { bloque.outputConnection.setCheck(null); }
          for (input of bloque.inputList) {
            if (input.connection) {
              input.setCheck(null);
            }
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
          f();
        }
        return;
      }
    }
    if (Main.workspace.isDragging()) { return; }
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

Main.opcion_idiomas = function() {
  let opt = document.getElementById("opcion_idiomas").value;
  for (i of Main.argumentosValidos.idioma) {
    if (opt == Blockly.Msg["TIPOS_IDIOMA_"+i.toUpperCase()]) {
      var search = window.location.search;
      if (search.length <= 1) {
        search = '?idioma=' + i;
      } else if (search.match(/[?&]idioma=[^&]*/)) {
        search = search.replace(/([?&]idioma=)[^&]*/, '$1' + i);
      } else {
        search = search.replace(/\?/, '?idioma=' + i + '&');
      }
      window.location = window.location.protocol + '//' +
            window.location.host + window.location.pathname + search;
    }
  }
};

Main.opcion_variables = function() {
  let opt = document.getElementById("opcion_variables").value;
  if (opt == Blockly.Msg["TIPOS_SOLO_LOCALES"]) {
    Main.modo_variables = Inferencia.LOCALES;
  } else if (opt == Blockly.Msg["TIPOS_SOLO_GLOBALES"]) {
    Main.modo_variables = Inferencia.GLOBALES;
  } else {
    Main.modo_variables = Inferencia.AMBAS;
  }
  Main.ejecutar();
};

Main.guardar = function() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Main.workspace))));
  element.setAttribute('download', "ws.xml");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Antes de terminar de cargar la página, llamo a esta función
Main.preCarga();

// Cuando se termina de cargar la página, llamo a inicializar
window.addEventListener('load', Main.inicializar);
