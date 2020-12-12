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
  Main.div = document.getElementById('blockly');
  Main.inyectarBlockly();   // Inyectar la interfaz de Blockly
  Main.registrarEventos();  // Registrar handlers para eventos
  Main.redimensionar();     // Llamo a esta función para que ajuste el tamaño al iniciar
  if (true) {
    Blockly.Xml.domToWorkspace(
    Blockly.Xml.textToDom('<xml><variables><variable id="[,!UIjKjh|_x;uw)2UY0">hola</variable><variable id="w^^.JQ5.Xs^zyQ(st.jq">chau</variable></variables><block type="main" id="MAIN" x="52" y="231"><statement name="LOOP"><block type="variables_set" id="w!yM2qAm}5RfslIMB3Q/"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field><value name="VALUE"><block type="procedures_callreturn" id="=Z%^w)]x*S``6~^|iNHr"><mutation name="hola"></mutation></block></value><next><block type="variables_set" id="}Cq1L[M)k|Zs;yP+jEZR"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="variables_get" id="Bm-[z#r4l@q{LDaEXNq4"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field></block></value></block></next></block></statement></block><block type="variables_set" id="~Cjy~A`NtWG=z,VVL}LY" x="50" y="341"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="text" id="dWc}`UoM?@PBxWK!mi2R"><field name="TEXT"></field></block></value></block><block type="procedures_defreturn" id="A43=$XHO=C8setE)ZQ9%" x="46" y="398"><field name="NAME">hola</field><comment pinned="false" h="80" w="160">Describe esta función...</comment><statement name="STACK"><block type="variables_set" id=")L7d$-~Q(x/!S:xKw(F("><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="variables_get" id="=e}B%i~UfINs#R4a3)s~"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field></block></value><next><block type="variables_set" id="O5MK5LJe8+~7G.a8PQ;-"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field><value name="VALUE"><block type="procedures_callreturn" id="n{|2L,dwQb1cdBI6yBU,"><mutation name="chau"></mutation></block></value></block></next></block></statement><value name="RETURN"><block type="procedures_callreturn" id="ghZ%#sO1^dJw(@Bcfon_"><mutation name="hola"></mutation></block></value></block><block type="procedures_defreturn" id=")U|(s$CJ(F;[y}PLs1^m" x="40" y="535"><field name="NAME">chau</field><comment pinned="false" h="80" w="160">Describe esta función...</comment><statement name="STACK"><block type="variables_set" id="cYoG|!tc!Z1LThGXVT(C"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="math_number" id="|VCw[J*IkO@qiDs`%aqd"><field name="NUM">5.5</field></block></value><next><block type="variables_set" id="jGTEqXW-vOeB.O:5rVVb"><field name="VAR" id="w^^.JQ5.Xs^zyQ(st.jq">chau</field><value name="VALUE"><block type="procedures_callreturn" id="W{x@$lTrs@Y1*Etcz}a@"><mutation name="chau"></mutation></block></value></block></next></block></statement><value name="RETURN"><block type="variables_get" id="zZZRZ:+fJt0)Wxo`smIo"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field></block></value></block><block type="variables_set" id="BeE{=d#t[8)Ay_q7h{o+" x="47" y="665"><field name="VAR" id="[,!UIjKjh|_x;uw)2UY0">hola</field><value name="VALUE"><block type="logic_boolean" id="$^(kVb@4?Rbw^D[K-0@V"><field name="BOOL">TRUE</field></block></value></block></xml>'),
    Main.workspace);
  } else {
    var childBlock = Main.workspace.newBlock("main", "MAIN");
    childBlock.initSvg();
    childBlock.render();
    childBlock.moveBy(50,50);
  }
  Main.ejecutar();
};

// Inyecta la interfaz Blockly en la div con id "blockly" y guarda el resultado en Main.workspace
Main.inyectarBlockly = function() {
  toolbox = document.getElementById('toolbox').outerHTML;
  // Toma como segundo argumento un objeto de configuración
  Main.workspace = Blockly.inject('blockly', {toolbox: toolbox});
};

// Registra handlers para todos los eventos
Main.registrarEventos = function () {
  Main.workspace.addChangeListener(function(event) {
    if (event.type != Blockly.Events.UI) {
      Main.ejecutar();
    }
  });
  window.addEventListener('resize', Main.redimensionar, false);   // Al cambiar el tamaño de la pantalla
};

// Esta función se ejecuta cada vez que cambia el tamaño de la ventana del navegador
//  (y una vez cuando se inicializa la página)
Main.redimensionar = function() {
  Main.div.style.height = `${window.innerHeight-35}px`;
  Main.div.style.width = `${2*window.innerWidth/5-10}px`;
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

// Antes de terminar de cargar la página, llamo a esta función
Main.preCarga();

// Cuando se termina de cargar la página, llamo a inicializar
window.addEventListener('load', Main.inicializar);
