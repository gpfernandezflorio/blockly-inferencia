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
  TIPOS.inicializar();
  TIPOS.agregarFuncionesBloques();
  Inferencia.inicializar({
    todosLosBloques: (ws) => ws.getAllBlocks(true),
    bloquesSuperiores: bloques_superiores,
    error: Main.error,
    advertencia: Main.advertencia,
    modo_variables: function() { return Main.modo_variables; }
  });
  Testing.inicializar();
  Main.div = document.getElementById('blockly');
  Main.inyectarBlockly();   // Inyectar la interfaz de Blockly
  Main.registrarEventos();  // Registrar handlers para eventos
  Main.redimensionar();     // Llamo a esta función para que ajuste el tamaño al iniciar
  if (false) {
    Blockly.Xml.domToWorkspace(
    Blockly.Xml.textToDom('<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="ZuGkN1Kxi.PaZkIyiWF{">x</variable><variable id="f*8*/}`Ah(n7Za1$u6pt">elemento</variable></variables><block type="main" id="MAIN" x="101" y="63"><statement name="LOOP"><block type="variables_set" id="W2pDn7l{8.p-6hDs1Dq)"><field name="VAR" id="f*8*/}`Ah(n7Za1$u6pt">elemento</field><value name="VALUE"><block type="procedures_callreturn" id="6#@QQEXd:|jra_YkvjE_"><mutation name="hacer algo"><arg name="x"></arg></mutation><value name="ARG0"><block type="math_number" id="YV#^{JMaI1APYoM%`dO@"><field name="NUM">123</field></block></value></block></value><next><block type="variables_set" id="j$,G4=$MB/@]$c?.S3qT"><field name="VAR" id="f*8*/}`Ah(n7Za1$u6pt">elemento</field><value name="VALUE"><block type="math_number" id="N|ncyL[=-!k6d%A:Z40y"><field name="NUM">123</field></block></value><next><block type="controls_if" id="$m](AuGS7{Wgj{/EU%e="><value name="IF0"><block type="procedures_callreturn" id="BPEoI8oDZ.4Uy+AL;U:T"><mutation name="hacer algo"><arg name="x"></arg></mutation><value name="ARG0"><block type="math_number" id="%.2*GwD._Ekx$]C!,XPh"><field name="NUM">123</field></block></value></block></value></block></next></block></next></block></statement></block><block type="procedures_defreturn" id="1DC]x%0{4iw7S7](Te~V" x="111" y="302"><mutation><arg name="x" varid="ZuGkN1Kxi.PaZkIyiWF{"></arg></mutation><field name="NAME">hacer algo</field><comment pinned="false" h="80" w="160">Describe esta función...</comment><statement name="STACK"><block type="controls_if" id="~@SmuJ(]MUgqx/ZOcm4b"><value name="IF0"><block type="variables_get" id="CKa7Wf^bJG:Z3[C%x4^X"><field name="VAR" id="ZuGkN1Kxi.PaZkIyiWF{">x</field></block></value></block></statement><value name="RETURN"><block type="text" id="/DR+aF$k(dSI~(lhmShU"><field name="TEXT"></field></block></value></block></xml>'),
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

  const actualizarRegistros = function(ws, oldData, xmlElement) {
    for (let b of ws.getAllBlocks(false)) {
      if (['register_def','register_create','register_obs'].includes(b.type) && b.name == oldData.name) {
        b.domToMutation(xmlElement, oldData);
      }
    }
  };

  const dropdown_register_obs_options = function() {
    if (this.sourceBlock_ && 'fields' in this.sourceBlock_) {
      const res = [];
      for (let i=0; i < this.sourceBlock_.fields.length; i++) {
        res.push([this.sourceBlock_.fields[i], `${i}`]);
      }
      return res;
    } else {
      return [[Blockly.Msg.FIELD_DEFAULT_NAME, `${0}`]];
    }
  }

  const dropdown_register_obs = function() {
    return new Blockly.FieldDropdown(dropdown_register_obs_options);
  };

  const register_mixin = {
    name: Blockly.Msg.REGISTER_DEFAULT_NAME,
    fields: [Blockly.Msg.FIELD_DEFAULT_NAME],
    mutationToDom: function() {
      const container = Blockly.utils.xml.createElement('mutation');
      container.setAttribute('name', this.name);
      for (let fieldName of this.fields) {
        const field = Blockly.utils.xml.createElement('field');
        field.setAttribute('name', fieldName);
        container.appendChild(field);
      }
      return container;
    },
    domToMutation: function(xmlElement, opt_old) {
      const fields = [];
      for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
        if (childNode.nodeName.toLowerCase() === 'field') {
            fields.push(childNode.getAttribute('name'));
        }
      }
      this.name = xmlElement.getAttribute('name');
      this.fields = fields;
      this.rebuild(opt_old);
    }
  };

  const register_mutator_mixin = Object.assign({
    compose: function(containerBlock) {
      const oldData = {name: this.name, fields: this.fields};
      this.name = containerBlock.getFieldValue("NAME");
      let itemBlock = containerBlock.getInputTargetBlock('STACK');
      const fields = [];
      while (itemBlock && !itemBlock.isInsertionMarker()) {
        fields.push(itemBlock.getFieldValue("NAME"));
        itemBlock = itemBlock.nextConnection &&
            itemBlock.nextConnection.targetBlock();
      }
      this.fields = fields;
      if (this.fields.length == 0) {
        this.fields.push(Blockly.Msg.FIELD_DEFAULT_NAME);
      }
      this.rebuild();
      if (!containerBlock.workspace.isDragging()) {
        actualizarRegistros(this.workspace, oldData, this.mutationToDom());
      }
    },
    decompose: function(workspace) {
      let containerBlock = workspace.newBlock('register_mutator_container');
      containerBlock.initSvg();
      containerBlock.setFieldValue(this.name, "NAME");
      let connection = containerBlock.getInput('STACK').connection;
      for (let i=0; i < this.fields.length; i++) {
        let itemBlock = workspace.newBlock('register_mutator_field');
        itemBlock.initSvg();
        itemBlock.setFieldValue(this.fields[i], "NAME");
        connection.connect(itemBlock.previousConnection);
        connection = itemBlock.nextConnection;
      }
      return containerBlock;
    },
    rebuild: function() {
      this.setFieldValue(this.name, "NAME")
      const appendInput = this.type == 'register_create'
        ? 'appendValueInput'
        : 'appendDummyInput';
      for (let i=0; i<this.fields.length; i++) {
        if (this.getInput(`FIELD_${i}`)) {
          this.setFieldValue(this.fields[i], `FIELD_${i}`);
        } else {
          this[appendInput](`FIELD_${i}`)
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(new Blockly.FieldLabel(this.fields[i]), `FIELD_${i}`);
        }
      }
      let i = this.fields.length;
      while (this.getInput(`FIELD_${i}`)) {
        this.removeInput(`FIELD_${i}`);
        i++;
      }
    }
  }, register_mixin);

  Blockly.Extensions.registerMutator(
    "register_def_mutator",
    Object.assign({
      definicionDeTipo: function() {
        return TIPOS.REGISTRO(this.name, this.fields);
      }
    }, register_mutator_mixin), function() {}, ['register_mutator_field']
  );
  Blockly.Extensions.registerMutator(
    "register_create_mutator",
    Object.assign({
      //
    }, register_mutator_mixin), function() {}, ['register_mutator_field']
  );
  Blockly.Extensions.registerMutator(
    "register_obs_mutator",
    Object.assign({
      rebuild: function(old) {
        const prev = this.getFieldValue("FIELD");
        const prevName = this.getField("FIELD").getText();
        this.getInput("REG").removeField("FIELD");
        this.getInput("REG").insertFieldAt(0, dropdown_register_obs(), "FIELD");
        delete this.getField("FIELD").generatedOptions_;
        if (this.fields.includes(prevName)) {
          // Sigue existiendo y no cambió de nombre, aunque podría estar en otra posición
          this.setFieldValue(`${this.fields.indexOf(prevName)}`, "FIELD");
        } else {
          // Fue eliminado o se cambió de nombre
          if (this.fields.length > prev) {
            // Hay uno en esa posición (probablemente cambió de nombre)
            // Si le asigno el mismo valor no se actualiza así que tengo que destruirlo y volver a crearlo
            this.setFieldValue(prev, "FIELD");
          } else {
            // Asigno el primero
            this.setFieldValue("0", "FIELD");
          }
        }
      }
    }, register_mixin), function() {}
  );
  Blockly.defineBlocksWithJsonArray([  // BEGIN JSON EXTRACT
    {
      "type": "main",
      "message0": "MAIN",
      "args0": [],
      "message1": "%1",
      "style": "procedure_blocks",
      "args1": [{"type":"input_statement","name":"LOOP"}],
      "inputsInline": false
    },{
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
    },{
      "type": "register_def",
      "message0": "%{BKY_REGISTER_DEF}",
      "args0": [
        {"type":"field_label","name":"NAME","text":"%{BKY_REGISTER_DEFAULT_NAME}"}
      ],
      "message1": "%1 %2",
      "args1": [
        {"type":"field_label","name":"FIELD_0","text":"%{BKY_FIELD_DEFAULT_NAME}"},
        {"type":"input_dummy","name":"FIELD_0","align":"RIGHT"}
      ],
      "style": "list_blocks",
      "mutator": "register_def_mutator"
    },{
      "type": "register_create",
      "message0": "%{BKY_REGISTER_CREATE}",
      "args0":[
        {"type":"field_label","name":"NAME","text":"%{BKY_REGISTER_DEFAULT_NAME}"}
      ],
      "message1": "%1 %2",
      "args1": [
        {"type":"field_label","name":"FIELD_0","text":"%{BKY_FIELD_DEFAULT_NAME}"},
        {"type":"input_value","name":"FIELD_0","align":"RIGHT"}
      ],
      "output": null,
      "style": "list_blocks",
      "inputsInline": true,
      "mutator": "register_create_mutator"
    },{
      "type": "register_obs",
      "message0": "%{BKY_REGISTER_OBS}",
      "args0":[
        {"type":"field_dropdown","name":"FIELD","options":dropdown_register_obs_options},
        {"type":"input_value","name":"REG","align":"RIGHT"}
      ],
      "output": null,
      "style": "list_blocks",
      "mutator": "register_obs_mutator"
    },{
      "type": "register_mutator_container",
      "message0": "%{BKY_REGISTER_NAME}",
      "args0": [{
        "type": "field_input",
        "name": "NAME",
        "text": "%{BKY_REGISTER_DEFAULT_NAME}"
      }],
      "message1": "%{BKY_FIELDS}",
      "message2": "%1",
      "args2":[{"type":"input_statement","name":"STACK"}],
      "enableContextMenu": false,
      "style": "list_blocks"
    },{
      "type": "register_mutator_field",
      "message0": "%1",
      "args0": [{"type":"field_input","name":"NAME","text":"%{BKY_FIELD_DEFAULT_NAME}"}],
      "previousStatement": null,
      "nextStatement": null,
      "enableContextMenu": false,
      "style": "list_blocks"
    }
  ]);  // END JSON EXTRACT (Do not delete this comment.)

  Main.generador['main'] = function(block) {
    var mainBranch = Main.generador.statementToCode(block, 'LOOP');
    return mainBranch;
  };

  Main.generador['variables_global_def'] = function(block) {
    return '';
  };

  Main.generador['register_def'] = function(block) {
    return '';
  };

  delete Blockly.Constants.Loops.CONTROL_FLOW_IN_LOOP_CHECK_MIXIN.onchange;
}

// Inyecta la interfaz Blockly en la div con id "blockly" y guarda el resultado en Main.workspace
Main.inyectarBlockly = function() {
  toolbox = document.getElementById('toolbox').outerHTML;
  // Toma como segundo argumento un objeto de configuración
  Main.workspace = Blockly.inject('blockly', {toolbox: toolbox});
};

// Registra handlers para todos los eventos
Main.registrarEventos = function() {
  Main.workspace.addChangeListener(function(event) {
    if (Main.ignorarEvento(event)) { return; }
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
    if (!Main.procesando) {
      Main.ejecutar();
    }
  });
  window.addEventListener('resize', Main.redimensionar, false);   // Al cambiar el tamaño de la pantalla
};

Main.ignorarEvento = function(evento) {
  // BLOCK_CREATE, BLOCK_DELETE, BLOCK_CHANGE, BLOCK_MOVE, VAR_CREATE, VAR_DELETE, VAR_RENAME
  // COMMENT_CREATE, COMMENT_DELETE, COMMENT_CHANGE, COMMENT_MOVE, FINISHED_LOADING
  return [
      Blockly.Events.UI,
      Blockly.Events.BLOCK_DRAG,
      Blockly.Events.SELECTED,
      Blockly.Events.CLICK,
      Blockly.Events.MARKER_MOVE,
      Blockly.Events.BUBBLE_OPEN,
      Blockly.Events.TRASHCAN_OPEN,
      Blockly.Events.TOOLBOX_ITEM_SELECT,
      Blockly.Events.THEME_CHANGE,
      Blockly.Events.VIEWPORT_CHANGE
    ].includes(evento.type);
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

Main.opcion_variables = function(opt) {
  if (opt == undefined) {
    opt = document.getElementById("opcion_variables").value;
  } else {
    document.getElementById("opcion_variables").value = opt;
  }
  if (opt == Blockly.Msg["TIPOS_SOLO_LOCALES"]) {
    Main.modo_variables = Inferencia.LOCALES;
  } else if (opt == Blockly.Msg["TIPOS_SOLO_GLOBALES"]) {
    Main.modo_variables = Inferencia.GLOBALES;
  } else {
    Main.modo_variables = Inferencia.AMBAS;
  }
  Main.ejecutar();
};

Main.opcion_subtipado_texto = function(opt) {
  if (opt == undefined) {
    opt = document.getElementById("opcion_subtipado_texto").value;
  } else {
    document.getElementById("opcion_subtipado_texto").value = opt;
  }
  if (opt == Blockly.Msg["TIPOS_SOLO_ENTRADAS"]) {
    TIPOS.subtiparTexto = 'solo_entradas';
  } else if (opt == Blockly.Msg["TIPOS_SIEMPRE"]) {
    TIPOS.subtiparTexto = 'siempre';
  } else {
    TIPOS.subtiparTexto = 'nunca';
  }
  Main.ejecutar();
};

Main.cargarBloques = function(strBloques) {
  let xmlDom;
  try {
    xmlDom = Blockly.Xml.textToDom(strBloques);
  } catch (e) { return; }
  if (xmlDom) {
    Blockly.mainWorkspace.clear();
    Blockly.Xml.domToWorkspace(xmlDom, Blockly.mainWorkspace);
  }
};

Main.abrir = function() {
  let selectFile = document.getElementById('select_file_wrapper');
  if (selectFile !== null) {
    selectFile.outerHTML = '';
  }
  let selectFileDom = document.createElement('INPUT');
  selectFileDom.type = 'file';
  selectFileDom.id = 'select_file';

  let selectFileWrapperDom = document.createElement('DIV');
  selectFileWrapperDom.id = 'select_file_wrapper';
  selectFileWrapperDom.style.display = 'none';
  selectFileWrapperDom.appendChild(selectFileDom);

  document.body.appendChild(selectFileWrapperDom);
  selectFile = document.getElementById('select_file');
  selectFile.addEventListener('change', function(e) {
    let archivo = e.target.files[0];
    if (archivo) {
      let reader = new FileReader();
      reader.onload = function() {
        Main.cargarBloques(reader.result);
      };
      reader.readAsText(archivo);
    }
  }, false);
  selectFile.click();
};

Main.guardar = function() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(Main.workspace))));
  element.setAttribute('download', "ws.xml");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

Main.testear = function() {
  const f = function(next) {
    Testing.proximoTest(function(resultado) {
      if (resultado.fail) { return; }
      const fin = function() {
        if (resultado.esElUltimo) {
          console.log("FIN");
          Testing.finalizar();
        } else {
          Testing.proximo++;
          next(resultado);
        }
      }
      for (let msg of resultado.mensajes) {
        console.log(msg);
      }
      if (resultado.exito) {
        fin();
      } else if (confirm(`El test "${resultado.nombre}" falló\n\n¿Desea ignorarlo y continuar con el resto de los tests?`)){
        fin();
      }
    });
  }
  Testing.iniciar();
  if (Testing.modo == Testing.MODO_INTERVALO) {
    const next = function(resultado) {
      setTimeout(function() { f(next) }, Testing.intervalo);
    };
    f(next);
  } else if (Testing.modo == Testing.MODO_INMEDIATO) {
    const next = function(resultado) {
      f(next);
    };
    f(next);
  } else if (Testing.modo == Testing.MODO_INTERACTIVO) {
    const next = function(resultado) {
      setTimeout(function() {
        if (resultado.exito) {
          if (confirm(`El test "${resultado.nombre}" Pasó\n\n¿Pasar al siguiente test?`)) {
            f(next);
          } else {
            Testing.proximo--;
          }
        } else {
          f(next);
        }
      }, 10);
    };
    f(next);
  }
};

Main.proximoTest = function() {
  let actual = Testing.proximo;
  if (actual === undefined) {
    actual = -1;
  } else {
    document.getElementById('boton_anteriorTest').disabled = false;
  }
  if (actual < Testing.tests.length-1) {
    Testing.proximo = actual + 1;
    Main.prepararTest(Testing.tests[Testing.proximo]);
    if (Testing.proximo == Testing.tests.length-1) {
      document.getElementById('boton_proximoTest').disabled = true;
    }
  }
};

Main.anteriorTest = function() {
  document.getElementById('boton_proximoTest').disabled = false;
  let actual = Testing.proximo;
  if (actual === undefined) {
    actual = -1;
  }
  if (actual > 0) {
    Testing.proximo = actual - 1;
    Main.prepararTest(Testing.tests[Testing.proximo]);
    if (Testing.proximo == 0) {
      document.getElementById('boton_anteriorTest').disabled = true;
    }
  }
};

Main.prepararTest = function(test, f) {
  Main.procesando = true;
  Main.opcion_variables(test.scope);
  Main.cargarBloques(test.bloques);
  delete Main.procesando;
  Main.ejecutar(f);
};

Main.error = function(bloque, tag, mensaje, manual=false) {
  if (bloque.id in Main.erroresYAdvertencias) {
    Main.erroresYAdvertencias[bloque.id].errores.push({tag:tag, mensaje:mensaje});
  } else {
    Main.erroresYAdvertencias[bloque.id] = {
      errores: [{tag:tag, mensaje:mensaje}],
      advertencias: []
    };
  }
  Errores.error(bloque, tag, mensaje, manual);
};

Main.advertencia = function(bloque, tag, mensaje, manual=false) {
  if (bloque.id in Main.erroresYAdvertencias) {
    Main.erroresYAdvertencias[bloque.id].advertencias.push({tag:tag, mensaje:mensaje});
  } else {
    Main.erroresYAdvertencias[bloque.id] = {
      errores: [],
      advertencias: [{tag:tag, mensaje:mensaje}]
    };
  }
  Errores.advertencia(bloque, tag, mensaje, manual);
};

// Antes de terminar de cargar la página, llamo a esta función
Main.preCarga();

// Cuando se termina de cargar la página, llamo a inicializar
window.addEventListener('load', Main.inicializar);
