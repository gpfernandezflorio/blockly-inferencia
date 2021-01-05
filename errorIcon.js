// -*- mode: java; c-basic-offset: 2; -*-
/**
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * Copyright © 2013-2016 Massachusetts Institute of Technology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @license
 * @fileoverview Object representing a warning for MIT App Inventor.
 * @author mckinney@mit.edu (Andrew F. McKinney)
 * @author fraser@google.com (Neil Fraser)
 * @author ewpatton@mit.edu (Evan W. Patton)
 */

'use strict';

/**
 * Class for an error.
 * @param {!Blockly.Block} block The block associated with this error.
 * @extends {Blockly.Icon}
 * @constructor
 */
Blockly.Error = function(block) {
  Blockly.Error.superClass_.constructor.call(this, block);
};
Blockly.utils.object.inherits(Blockly.Error, Blockly.Warning);

/**
 * Radius of the warning icon.
 */
Blockly.Error.ICON_RADIUS = 8;

/**
 * Create the icon on the block.
 * @private
 */
Blockly.Error.prototype.drawIcon_ = function(group) {
  /* Here's the markup that will be generated:
  <g class="blocklyIconGroup">
    <path class="blocklyIconShield" d="..."/>
    <text class="blocklyIconMark" x="8" y="13">!</text>
  </g>
  */
  Blockly.utils.dom.createSvgElement('circle',
      {'class': 'blocklyErrorIconOutline',
       'r': Blockly.Error.ICON_RADIUS,
       'cx': Blockly.Error.ICON_RADIUS,
       'cy': Blockly.Error.ICON_RADIUS}, group);
  Blockly.utils.dom.createSvgElement('path',
      {'class': 'blocklyErrorIconX',
       'd': 'M 4,4 12,12 8,8 4,12 12,4'},
                           // X fills circle vvv
       //'d': 'M 3.1931458,3.1931458 12.756854,12.756854 8,8 3.0931458,12.756854 12.756854,3.0931458'},
      group);
};

/**
 * Create the text for the error's bubble.
 * @param {string} text The text to display.
 * @return {!Element} The top-level node of the text.
 * @private
 */
Blockly.Warning.textToDom_ = function(text) {
  var paragraph = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.TEXT,
      {
        'class': 'blocklyText blocklyBubbleText',
        'y': Blockly.Bubble.BORDER_WIDTH
      },
      null);
  var lines = text.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var c = {'dy': '1em', 'x': Blockly.Bubble.BORDER_WIDTH};
    var texto = lines[i];
    if (texto.startsWith('LINK<<')) {
      var dots = texto.search(">>");
      c.onclick = texto.substring(dots+2);
      texto = texto.substring(6,dots);
    } else {
      c.class = 'blocklyNoPointerEvents';
    }
    var tspanElement = Blockly.utils.dom.createSvgElement('tspan', c, paragraph);
    var textNode = document.createTextNode(texto);
    tspanElement.appendChild(textNode);
  }
  return paragraph;
};

/**
 * Dispose of this error.
 */
Blockly.Error.prototype.dispose = function() {
  this.block_.error = null;
  Blockly.Icon.prototype.dispose.call(this);
};

/**
 * Block's error icon (if any).
 * @type {Blockly.Error}
 */
Blockly.BlockSvg.prototype.error = null;
Blockly.BlockSvg.prototype.errorTextDb_ = null;

/**
 * Returns a list of mutator, comment, and warning icons.
 * @return {!Array} List of icons.
 */
Blockly.BlockSvg.prototype.getIcons = (function(func) {
  return function() {
    var icons = func.call(this);
    if (this.error) {
      icons.push(this.error);
    }
    return icons;
  };
})(Blockly.BlockSvg.prototype.getIcons);

/**
 * Set this block's error text.
 * @param {?string} text The text, or null to delete.
 */
Blockly.BlockSvg.prototype.setErrorText = function(text, opt_id) {
  if (!Blockly.Error) {
    throw Error('Missing require for Blockly.Error');
  }
  if (!this.errorTextDb_) {
    // Create a database of warning PIDs.
    // Only runs once per block (and only those with warnings).
    this.errorTextDb_ = Object.create(null);
  }
  var id = opt_id || '';
  if (!id) {
    // Kill all previous pending processes, this edit supersedes them all.
    for (var n in this.errorTextDb_) {
      clearTimeout(this.errorTextDb_[n]);
      delete this.errorTextDb_[n];
    }
  } else if (this.errorTextDb_[id]) {
    // Only queue up the latest change.  Kill any earlier pending process.
    clearTimeout(this.errorTextDb_[id]);
    delete this.errorTextDb_[id];
  }
  if (this.workspace.isDragging()) {
    // Don't change the warning text during a drag.
    // Wait until the drag finishes.
    var thisBlock = this;
    this.errorTextDb_[id] = setTimeout(function() {
      if (thisBlock.workspace) {  // Check block wasn't deleted.
        delete thisBlock.errorTextDb_[id];
        thisBlock.setErrorText(text, id);
      }
    }, 100);
    return;
  }
  if (this.isInFlyout) {
    text = null;
  }

  var changedState = false;
  if (typeof text == 'string') {
    // Bubble up to add a warning on top-most collapsed block.
    var parent = this.getSurroundParent();
    var collapsedParent = null;
    while (parent) {
      if (parent.isCollapsed()) {
        collapsedParent = parent;
      }
      parent = parent.getSurroundParent();
    }
    if (collapsedParent) {
      collapsedParent.setErrorText(Blockly.Msg['COLLAPSED_WARNINGS_WARNING'],
          Blockly.BlockSvg.COLLAPSED_WARNING_ID);
    }

    if (!this.error) {
      this.error = new Blockly.Error(this);
      changedState = true;
    }
    this.error.setText(/** @type {string} */ (text), id);
  } else {
    // Dispose all errors if no ID is given.
    if (this.error && !id) {
      this.error.dispose();
      changedState = true;
    } else if (this.error) {
      var oldText = this.error.getText();
      this.error.setText('', id);
      var newText = this.error.getText();
      if (!newText) {
        this.error.dispose();
      }
      changedState = oldText != newText;
    }
  }
  if (changedState && this.rendered) {
    this.render();
    // Adding or removing an error icon will cause the block to change shape.
    this.bumpNeighbours();
  }
};
