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
    Blockly.Xml.textToDom('<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="7*i+vj[f-5|_LY!#edHh">elemento</variable></variables><block type="main" id="MAIN" x="50" y="50"><statement name="LOOP"><block type="variables_set" id="=1P5!x2v48:?#!e(5xud"><field name="VAR" id="7*i+vj[f-5|_LY!#edHh">elemento</field><value name="VALUE"><block type="lists_create_with" id="^kQ3jzXIGx;/kYp8|0C:"><mutation items="3"></mutation><value name="ADD1"><block type="logic_boolean" id="WIb+3Nc`dSmeo^^LqD3I"><field name="BOOL">TRUE</field></block></value></block></value><next><block type="lists_setIndex" id="~T,?IUl)Z{1Zc4eNFzaa"><mutation at="true"></mutation><field name="MODE">SET</field><field name="WHERE">FROM_START</field><value name="LIST"><shadow type="lists_create_with" id="N#_I9gZ9s]9F2d?+Pkm^"><mutation items="0"></mutation></shadow></value><value name="TO"><block type="math_constant" id="C~_%3)=bDPfId^N25^Mc"><field name="CONSTANT">PI</field></block></value></block></next></block></statement></block><block type="variables_get" id="~H-XgCfGoZ~c|8mfP!`P" x="244" y="331"><field name="VAR" id="7*i+vj[f-5|_LY!#edHh">elemento</field></block></xml>'),
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

  Inferencia.inicializar({
    bloquesSuperiores: bloques_superiores,
    error: Main.error,
    advertencia: Main.error,
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
// tag es string pero mensaje puede ser string o lista de strings
Main.error = function(bloque, tag, mensaje) {
  if (typeof(mensaje)=="string") { Main.error(bloque, tag, mensaje.split("\n")); }
  else if (Array.isArray(mensaje)) {
    if (mensaje.length == 1) {
      Main.errorBloque(bloque, tag, mensaje[0]);
    } else {
      let i = 0;
      for (msg of mensaje) {
        i++;
        Main.errorBloque(bloque, tag + " - "+i, msg);
      }
    }
  }
};

// tag y mensaje son strings
Main.errorBloque = function(bloque, tag, mensaje) {
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
