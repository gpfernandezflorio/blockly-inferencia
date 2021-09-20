Testing = {
  tests:[{
    nombre: 'Tipos básicos',
    bloques: '<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="p;s}ZbKi-VsVlg1U/H:4">entero</variable><variable id="-8d2)./47+tyhXYK7o+!">booleano</variable><variable id="i4-~d!|kNVsH4{fZ]7,7">texto</variable><variable id="mnN1tkv}}@xOQxXD2Ze]">lista de enteros</variable><variable id="2t?Uk_$pZ/LWVfty*ZR,">lista de lista de fracciones</variable></variables><block type="main" id="MAIN" x="226" y="303"><statement name="LOOP"><block type="variables_set" id="W#e10i_?X4N{{fDm;N$+"><field name="VAR" id="p;s}ZbKi-VsVlg1U/H:4">entero</field><value name="VALUE"><block type="math_number" id="^t7X5~JM*_R1-{B#0335"><field name="NUM">2</field></block></value><next><block type="variables_set" id="!XL;1T9jHzDX_dD=QY5h"><field name="VAR" id="-8d2)./47+tyhXYK7o+!">booleano</field><value name="VALUE"><block type="logic_boolean" id="kKd+;QvnkvEOgE]2qLn)"><field name="BOOL">TRUE</field></block></value><next><block type="variables_set" id="@2GoF#1n?e]0rOH=XNs-"><field name="VAR" id="i4-~d!|kNVsH4{fZ]7,7">texto</field><value name="VALUE"><block type="text" id="!|UsQrIu*yhz3b+=hn/h"><field name="TEXT"></field></block></value><next><block type="variables_set" id="yCWCIzSI~y|JlMZ6F3Mg"><field name="VAR" id="mnN1tkv}}@xOQxXD2Ze]">lista de enteros</field><value name="VALUE"><block type="lists_create_with" id="fHm{|0x#m)b5v(u7:(lM"><mutation items="1"></mutation><value name="ADD0"><block type="math_number" id="j!65Lh$E3%V]QQU9zc+h"><field name="NUM">2</field></block></value></block></value><next><block type="variables_set" id="jwVfH:;SqjEw0hEt!N.w"><field name="VAR" id="2t?Uk_$pZ/LWVfty*ZR,">lista de lista de fracciones</field><value name="VALUE"><block type="lists_create_with" id="L`jMpZ7Hx=+J_CqbPF0h"><mutation items="1"></mutation><value name="ADD0"><block type="lists_create_with" id="iq%.nkDd)e8X67cMhJXg"><mutation items="1"></mutation><value name="ADD0"><block type="math_number" id="g2VsJham0zR*Zb/U=;3i"><field name="NUM">1.5</field></block></value></block></value></block></value></block></next></block></next></block></next></block></next></block></statement></block></xml>',
    scope: Blockly.Msg["TIPOS_SOLO_LOCALES"],
    resultado: {entero: TIPOS.ENTERO, booleano: TIPOS.BINARIO, texto: TIPOS.TEXTO, 'lista de enteros': TIPOS.LISTA(TIPOS.ENTERO),
      'lista de lista de fracciones': TIPOS.LISTA(TIPOS.LISTA(TIPOS.FRACCION))},
    errores: []
  },{
    nombre: 'Transitividad',
    bloques: '<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="|g/5tW:ykrtj|fz0]rCN">d</variable><variable id="p;s}ZbKi-VsVlg1U/H:4">a</variable><variable id="-8d2)./47+tyhXYK7o+!">b</variable><variable id="i4-~d!|kNVsH4{fZ]7,7">c</variable></variables><block type="main" id="MAIN" x="226" y="303"><statement name="LOOP"><block type="variables_set" id="N1[xPlY`rrB+:LsYn{+("><field name="VAR" id="|g/5tW:ykrtj|fz0]rCN">d</field><value name="VALUE"><block type="lists_create_with" id="a7nK[cZQ^Yt(Hc41-tlj"><mutation items="1"></mutation><value name="ADD0"><block type="variables_get" id="SVHyD)TBZZ*#sc([}eh="><field name="VAR" id="i4-~d!|kNVsH4{fZ]7,7">c</field></block></value></block></value><next><block type="variables_set" id="W#e10i_?X4N{{fDm;N$+"><field name="VAR" id="p;s}ZbKi-VsVlg1U/H:4">a</field><value name="VALUE"><block type="variables_get" id="ipm;K):E.cvH(+/lkEiR"><field name="VAR" id="-8d2)./47+tyhXYK7o+!">b</field></block></value><next><block type="variables_set" id="!XL;1T9jHzDX_dD=QY5h"><field name="VAR" id="-8d2)./47+tyhXYK7o+!">b</field><value name="VALUE"><block type="variables_get" id="n)vSXJ~X~Zklp[0=b)Nj"><field name="VAR" id="i4-~d!|kNVsH4{fZ]7,7">c</field></block></value><next><block type="variables_set" id="@2GoF#1n?e]0rOH=XNs-"><field name="VAR" id="i4-~d!|kNVsH4{fZ]7,7">c</field><value name="VALUE"><block type="logic_boolean" id="=j0J|{je[n$Z#5jTb[q9"><field name="BOOL">TRUE</field></block></value></block></next></block></next></block></next></block></statement></block></xml>',
    scope: Blockly.Msg["TIPOS_SOLO_LOCALES"],
    resultado: {a: TIPOS.BINARIO, b: TIPOS.BINARIO, c: TIPOS.BINARIO, d: TIPOS.LISTA(TIPOS.BINARIO)},
    errores: []
  },{
    nombre: 'Transitividad con subtipado',
    bloques: '<xml xmlns="https://developers.google.com/blockly/xml"><variables><variable id="?})m7mj%s%$sVutYQI?#">item</variable></variables><block type="main" id="MAIN" x="155" y="76"><statement name="LOOP"><block type="controls_repeat_ext" id=".7oA/{;ilV0rc@G_tqWl"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow><block type="variables_get" id="n_?|R!Z35D@}nI:S)@?d"><field name="VAR" id="?})m7mj%s%$sVutYQI?#">item</field></block></value><next><block type="controls_repeat_ext" id="~q1p$dv1;]f|$v$AEq4="><value name="TIMES"><shadow type="math_number" id="4SQ5:se^D6}HcNWzRN0j"><field name="NUM">10</field></shadow><block type="procedures_callreturn" id="v-F*bQ~@j3bTZgkj4aOo"><mutation name="do something"></mutation></block></value></block></next></block></statement></block><block type="procedures_defreturn" id="Y#2PGgwKqLl?[r_|E%%_" inline="true" x="78" y="274"><mutation statements="false"></mutation><field name="NAME">do something</field><comment pinned="false" h="80" w="160">Describe this function...</comment><value name="RETURN"><block type="math_number" id="!~6UvF=$ej1n:kIi,Oij"><field name="NUM">1.5</field></block></value></block><block type="variables_global_def" id="49;%)lw)$:-M7vH=5crq" x="135" y="320"><field name="VAR" id="?})m7mj%s%$sVutYQI?#">item</field><value name="VALUE"><block type="math_number" id="LnWUM/v8IGK[o[_:Pb|s"><field name="NUM">1.5</field></block></value></block></xml>',
    scope: Blockly.Msg["TIPOS_SOLO_GLOBALES"],
    resultado: {item: TIPOS.FRACCION, 'do something': TIPOS.FRACCION},
    errores: [/*sí, uno en cada repeat*/]
  }], intervalo: 500, MODO_INTERVALO: 0, MODO_INMEDIATO: 1, MODO_INTERACTIVO:2
};

Testing.modo = Testing.MODO_INTERVALO;

Testing.iniciar = function() {
  Testing.proximo = 0;
};

Testing.proximoTest = function() {
  if (Testing.proximo !== undefined && Testing.proximo < Testing.tests.length) {
    let resultado = Testing.ejecutarTest(Testing.tests[Testing.proximo]);
    Testing.proximo++;
    if (Testing.proximo == Testing.tests.length) {
      resultado.esElUltimo = true;
    };
    return resultado;
  }
  return {fail: true};
};

Testing.finalizar = function() {
  delete Testing.proximo;
};

Testing.ejecutarTest = function(test) {
  let resultado = {
    nombre: test.nombre
  };
  document.getElementById("opcion_variables").value = test.scope;
  Main.cargarBloques(test.bloques);
  Main.ejecutar();
  return resultado;
};
