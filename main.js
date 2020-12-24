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
    Blockly.Xml.textToDom('<xml><variables><variable id="[,!UIjKjh|_x;uw)2UY0">hola</variable><variable id="w^^.JQ5.Xs^zyQ(st.jq">chau</variable></variables><block type="lists_indexOf" id="bctp0]IQBCta6M)E^=v]" x="52" y="21"><field name="END">FIRST</field><value name="VALUE"><shadow type="lists_create_with" id="q6p]*J/wd)V8TZxD~2rs"><mutation items="0"></mutation></shadow></value></block><block type="lists_getIndex" id="7Ixd)ggu)N`?gr0T@`Az" x="125" y="72"><mutation statement="false" at="true"></mutation><field name="MODE">GET</field><field name="WHERE">FROM_START</field><value name="VALUE"><shadow type="lists_create_with" id="=,!tr9}kB6x?o%1;@3tD"><mutation items="0"></mutation></shadow></value></block><block type="lists_setIndex" id="4n!tRY@g~R2G;?h%N$]z" x="141" y="127"><mutation at="true"></mutation><field name="MODE">SET</field><field name="WHERE">FROM_START</field><value name="LIST"><shadow type="lists_create_with" id="K^2ZQrm7cLvpIC!yGwkX"><mutation items="0"></mutation></shadow></value></block><block type="lists_getSublist" id="RAFT4KwP6?@?Ip[s9HOm" x="107" y="189"><mutation at1="true" at2="true"></mutation><field name="WHERE1">FROM_START</field><field name="WHERE2">FROM_START</field><value name="LIST"><shadow type="lists_create_with" id="wbDyERGgRdW.{|fZp5-S"><mutation items="0"></mutation></shadow></value></block><block type="main" id="MAIN" x="21" y="219"><statement name="LOOP"><block type="variables_set" id="w!yM2qAm}5RfslIMB3Q/"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field><value name="VALUE"><block type="lists_create_with" id="$t`GtPt$?C/B::-0:aOS"><mutation items="3"></mutation><value name="ADD1"><block type="lists_create_with" id="%pb`oCyBK7%xb,=#y/g("><mutation items="3"></mutation><value name="ADD0"><block type="text" id="dWc}`UoM?@PBxWK!mi2R"><field name="TEXT"></field></block></value></block></value></block></value><next><block type="variables_set" id="Q_:Uxb7ZD(%E]3+mR@.7"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="logic_boolean" id="0}kS+o+Nr`mq#;3t~XXE"><field name="BOOL">TRUE</field></block></value><next><block type="variables_set" id="}Cq1L[M)k|Zs;yP+jEZR"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="text" id="c@EBsmisRwZwcB?JC!R("><field name="TEXT"></field></block></value><next><block type="variables_set" id="~Cjy~A`NtWG=z,VVL}LY"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="logic_boolean" id="F8[43N7|sBZol{p$6URp"><field name="BOOL">TRUE</field></block></value><next><block type="variables_set" id="SmSg(yH7BQ23-dh`/X[f"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="math_number" id="|VCw[J*IkO@qiDs`%aqd"><field name="NUM">5.5</field></block></value><next><block type="variables_set" id="cr6iP?KNQScqn6(7)so,"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="logic_boolean" id="cPb3W@=dk37,Hy7`IJrQ"><field name="BOOL">TRUE</field></block></value></block></next></block></next></block></next></block></next></block></next></block></statement></block><block type="logic_boolean" id="?A00`*3oiGceO0eoPtge" x="438" y="387"><field name="BOOL">TRUE</field></block><block type="logic_boolean" id="0nmz2D34Jva?Y+]3!Pf," x="441" y="421"><field name="BOOL">TRUE</field></block><block type="variables_get" id="Bm-[z#r4l@q{LDaEXNq4" x="459" y="493"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field></block><block type="procedures_defreturn" id=")U|(s$CJ(F;[y}PLs1^m" x="15" y="549"><field name="NAME">chau</field><comment pinned="false" h="80" w="160">Describe esta función...</comment><statement name="STACK"><block type="variables_set" id="cYoG|!tc!Z1LThGXVT(C"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><next><block type="variables_set" id="jGTEqXW-vOeB.O:5rVVb"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field><value name="VALUE"><block type="procedures_callreturn" id="W{x@$lTrs@Y1*Etcz}a@"><mutation name="chau"></mutation></block></value></block></next></block></statement><value name="RETURN"><block type="variables_get" id="zZZRZ:+fJt0)Wxo`smIo"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field></block></value></block><block type="procedures_defreturn" id="A43=$XHO=C8setE)ZQ9%" x="278" y="547"><field name="NAME">hola</field><comment pinned="false" h="80" w="160">Describe esta función...</comment><statement name="STACK"><block type="variables_set" id=")L7d$-~Q(x/!S:xKw(F("><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="variables_get" id="=e}B%i~UfINs#R4a3)s~"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field></block></value><next><block type="variables_set" id="O5MK5LJe8+~7G.a8PQ;-"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field><value name="VALUE"><block type="procedures_callreturn" id="n{|2L,dwQb1cdBI6yBU,"><mutation name="chau"></mutation></block></value></block></next></block></statement><value name="RETURN"><block type="procedures_callreturn" id="tj`kK8LC!vG,Nf:ZplTx"><mutation name="hola"></mutation></block></value></block></xml>'),
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
  // TODO: Averiguar la forma correcta de hacer esto:
  //bloque.warning.createBubble();
};

// Antes de terminar de cargar la página, llamo a esta función
Main.preCarga();

// Cuando se termina de cargar la página, llamo a inicializar
window.addEventListener('load', Main.inicializar);
