(function() {
  'use strict';

  // ── Auto-detect base URL from the script tag ──────────────────────────
  var scripts = document.getElementsByTagName('script');
  var currentScript = document.currentScript;
  var baseUrl = '';

  if (currentScript && currentScript.src) {
    var url = new URL(currentScript.src);
    baseUrl = url.origin;
  } else {
    // Fallback: find the script by src containing embed.js
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('embed.js') !== -1) {
        var url2 = new URL(scripts[i].src);
        baseUrl = url2.origin;
        break;
      }
    }
  }

  // ── Inject styles ─────────────────────────────────────────────────────
  var css = [
    '.ff-form { --ff-primary: #2563eb; --ff-bg: #ffffff; --ff-text: #1f2937; --ff-radius: 6px; --ff-font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-family: var(--ff-font); font-size: 15px; color: var(--ff-text); line-height: 1.5; max-width: 100%; box-sizing: border-box; }',
    '.ff-form *, .ff-form *::before, .ff-form *::after { box-sizing: border-box; }',
    '.ff-page-title { font-size: 1.25em; font-weight: 600; margin: 0 0 16px 0; }',
    '.ff-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }',
    '.ff-col { flex: 1 1 0; min-width: 0; }',
    '.ff-field { margin-bottom: 4px; }',
    '.ff-label { display: block; font-size: 0.875em; font-weight: 500; margin-bottom: 4px; }',
    '.ff-required { color: #dc2626; margin-left: 2px; }',
    '.ff-input, .ff-select, .ff-textarea { display: block; width: 100%; padding: 8px 10px; font-size: 0.9375em; font-family: inherit; border: 1px solid #d1d5db; border-radius: var(--ff-radius); background: #fff; color: var(--ff-text); outline: none; transition: border-color 0.15s; }',
    '.ff-input:focus, .ff-select:focus, .ff-textarea:focus { border-color: var(--ff-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--ff-primary) 15%, transparent); }',
    '.ff-input.ff-error-input, .ff-select.ff-error-input, .ff-textarea.ff-error-input { border-color: #dc2626; }',
    '.ff-textarea { min-height: 80px; resize: vertical; }',
    '.ff-error { color: #dc2626; font-size: 0.8em; margin-top: 3px; min-height: 0; }',
    '.ff-radio-group, .ff-checkbox-group { display: flex; flex-direction: column; gap: 6px; }',
    '.ff-radio-label, .ff-checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 0.9375em; cursor: pointer; }',
    '.ff-radio-label input, .ff-checkbox-label input { margin: 0; accent-color: var(--ff-primary); }',
    '.ff-select { appearance: auto; }',
    '.ff-multi-select { height: auto; min-height: 36px; }',
    '.ff-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; gap: 8px; }',
    '.ff-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; font-size: 0.9375em; font-family: inherit; font-weight: 500; border: none; border-radius: var(--ff-radius); cursor: pointer; transition: background 0.15s, opacity 0.15s; }',
    '.ff-btn-primary { background: var(--ff-primary); color: #fff; }',
    '.ff-btn-primary:hover { filter: brightness(0.9); }',
    '.ff-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }',
    '.ff-btn-secondary { background: #e5e7eb; color: var(--ff-text); border-radius: var(--ff-radius); }',
    '.ff-btn-secondary:hover { background: #d1d5db; }',
    '.ff-progress { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; font-size: 0.8em; color: #6b7280; }',
    '.ff-progress-bar { flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; }',
    '.ff-progress-fill { height: 100%; background: var(--ff-primary); border-radius: 2px; transition: width 0.3s; }',
    '.ff-html-block { margin-bottom: 4px; }',
    '.ff-divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }',
    '.ff-hidden { display: none !important; }',
    '.ff-thank-you { text-align: center; padding: 32px 16px; }',
    '.ff-thank-you h3 { font-size: 1.25em; margin: 0 0 8px 0; }',
    '.ff-thank-you p { color: #6b7280; margin: 0; }',
    '.ff-loading { text-align: center; padding: 24px; color: #6b7280; }',
    '.ff-error-msg { text-align: center; padding: 24px; color: #dc2626; }',
    '.ff-file-input { font-size: 0.875em; }',
    '@media (max-width: 600px) { .ff-row { flex-direction: column; gap: 0; } .ff-col { width: 100%; } }'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Utility helpers ───────────────────────────────────────────────────
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'className') node.className = attrs[k];
        else if (k === 'innerHTML') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      for (var i = 0; i < children.length; i++) {
        if (typeof children[i] === 'string') node.appendChild(document.createTextNode(children[i]));
        else if (children[i]) node.appendChild(children[i]);
      }
    }
    return node;
  }

  // ── Validation ────────────────────────────────────────────────────────
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var phoneRe = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;

  function validateField(field, value) {
    if (!field) return null;
    var v = field.validation || {};
    var val = (value || '').toString().trim();

    if (field.required && !val && field.type !== 'checkbox') return 'This field is required.';
    if (field.required && field.type === 'checkbox' && !value) return 'This field is required.';
    if (!val && field.type !== 'checkbox') return null; // not required, no value: skip

    if (field.type === 'email' && !emailRe.test(val)) return 'Please enter a valid email address.';
    if (field.type === 'phone' && !phoneRe.test(val)) return 'Please enter a valid phone number.';

    if (v.minLength && val.length < v.minLength) return 'Must be at least ' + v.minLength + ' characters.';
    if (v.maxLength && val.length > v.maxLength) return 'Must be no more than ' + v.maxLength + ' characters.';

    if (field.type === 'number' && val !== '') {
      var num = parseFloat(val);
      if (isNaN(num)) return 'Please enter a valid number.';
      if (v.min !== undefined && num < v.min) return 'Must be at least ' + v.min + '.';
      if (v.max !== undefined && num > v.max) return 'Must be no more than ' + v.max + '.';
    }

    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(val)) return v.customMessage || 'Invalid format.';
      } catch(e) { /* ignore bad regex */ }
    }

    return null;
  }

  // ── Condition evaluation ──────────────────────────────────────────────
  function evalConditions(conditions, fieldValues) {
    var result = { hidden: {}, setValues: {}, skipToPage: null };
    if (!conditions || !conditions.length) return result;

    for (var c = 0; c < conditions.length; c++) {
      var cond = conditions[c];
      var results = [];

      for (var r = 0; r < cond.rules.length; r++) {
        var rule = cond.rules[r];
        var val = (fieldValues[rule.fieldId] || '').toString();
        var match = false;

        switch (rule.operator) {
          case 'equals': match = val === rule.value; break;
          case 'notEquals': match = val !== rule.value; break;
          case 'contains': match = val.indexOf(rule.value) !== -1; break;
          case 'notContains': match = val.indexOf(rule.value) === -1; break;
          case 'greaterThan': match = parseFloat(val) > parseFloat(rule.value); break;
          case 'lessThan': match = parseFloat(val) < parseFloat(rule.value); break;
          case 'isEmpty': match = !val; break;
          case 'isNotEmpty': match = !!val; break;
        }
        results.push(match);
      }

      var pass = cond.logic === 'OR' ? results.some(Boolean) : results.every(Boolean);

      for (var a = 0; a < cond.actions.length; a++) {
        var action = cond.actions[a];
        if (action.type === 'hide' && pass && action.targetFieldId) result.hidden[action.targetFieldId] = true;
        if (action.type === 'show' && !pass && action.targetFieldId) result.hidden[action.targetFieldId] = true;
        if (action.type === 'setValue' && pass && action.targetFieldId) {
          result.setValues[action.targetFieldId] = action.value !== undefined ? action.value : '';
        }
        if (action.type === 'skipToPage' && pass && action.targetPageIndex !== undefined) {
          result.skipToPage = action.targetPageIndex;
        }
      }
    }
    return result;
  }

  // ── Form renderer ─────────────────────────────────────────────────────
  function FormForge(container, embedKey) {
    var self = this;
    this.container = container;
    this.embedKey = embedKey;
    this.data = null;
    this.currentPage = 0;
    this.fieldValues = {};
    this.fieldErrors = {};

    this.container.innerHTML = '<div class="ff-loading">Loading form...</div>';

    fetch(baseUrl + '/api/embed/' + encodeURIComponent(embedKey))
      .then(function(res) {
        if (!res.ok) throw new Error('Form not found');
        return res.json();
      })
      .then(function(data) {
        self.data = data;
        self.initDefaults();
        self.render();
      })
      .catch(function(err) {
        self.container.innerHTML = '<div class="ff-error-msg">' + (err.message || 'Failed to load form') + '</div>';
      });
  }

  FormForge.prototype.initDefaults = function() {
    var fields = this.data.definition.fields || {};
    for (var id in fields) {
      var f = fields[id];
      if (f.defaultValue !== undefined && f.defaultValue !== '') {
        this.fieldValues[id] = f.defaultValue;
      }
      if (f.type === 'checkbox') {
        this.fieldValues[id] = this.fieldValues[id] || [];
      }
      if (f.type === 'multi_select') {
        this.fieldValues[id] = this.fieldValues[id] || [];
      }
    }
  };

  // ── Style config helpers ─────────────────────────────────────────────
  var radiusMap = { none: '0px', small: '4px', medium: '6px', large: '12px' };
  var fontMap = {
    'default': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'monospace': '"SF Mono", "Fira Code", monospace'
  };

  function applyStyleConfig(wrapper, styleConfig) {
    if (!styleConfig) return;
    var s = wrapper.style;
    if (styleConfig.primaryColor) s.setProperty('--ff-primary', styleConfig.primaryColor);
    if (styleConfig.backgroundColor) s.setProperty('--ff-bg', styleConfig.backgroundColor);
    if (styleConfig.textColor) s.setProperty('--ff-text', styleConfig.textColor);
    s.setProperty('--ff-radius', radiusMap[styleConfig.borderRadius] || '6px');
    s.setProperty('--ff-font', fontMap[styleConfig.fontFamily] || fontMap['default']);

    if (styleConfig.backgroundColor) wrapper.style.background = styleConfig.backgroundColor;
    if (styleConfig.textColor) wrapper.style.color = styleConfig.textColor;
    if (styleConfig.fontFamily) wrapper.style.fontFamily = fontMap[styleConfig.fontFamily] || fontMap['default'];
  }

  FormForge.prototype.render = function() {
    var def = this.data.definition;
    if (!def || !def.pages || !def.pages.length) {
      this.container.innerHTML = '<div class="ff-error-msg">This form has no content.</div>';
      return;
    }

    var wrapper = el('div', { className: 'ff-form' });
    this.container.innerHTML = '';
    this.container.appendChild(wrapper);

    // Apply style configuration
    applyStyleConfig(wrapper, this.data.styleConfig);

    var pages = def.pages;
    var isMulti = pages.length > 1;

    // Progress bar for multi-step
    if (isMulti) {
      var pct = Math.round(((this.currentPage + 1) / pages.length) * 100);
      var progress = el('div', { className: 'ff-progress' }, [
        el('span', null, 'Step ' + (this.currentPage + 1) + ' of ' + pages.length),
        el('div', { className: 'ff-progress-bar' }, [
          el('div', { className: 'ff-progress-fill', style: 'width:' + pct + '%' })
        ])
      ]);
      wrapper.appendChild(progress);
    }

    var page = pages[this.currentPage];
    if (page.title) {
      wrapper.appendChild(el('div', { className: 'ff-page-title' }, page.title));
    }

    var condResult = evalConditions(def.conditions, this.fieldValues);
    var hidden = condResult.hidden;

    // Apply setValue actions
    for (var svId in condResult.setValues) {
      if (this.fieldValues[svId] !== condResult.setValues[svId]) {
        this.fieldValues[svId] = condResult.setValues[svId];
      }
    }

    // Render rows
    for (var r = 0; r < page.rows.length; r++) {
      var row = page.rows[r];
      var rowEl = el('div', { className: 'ff-row' });
      var hasVisible = false;

      for (var c = 0; c < row.columns.length; c++) {
        var col = row.columns[c];
        var field = def.fields[col.fieldId];
        if (!field) continue;

        var isHidden = hidden[col.fieldId];
        var widthPct = (col.width / 12 * 100) + '%';
        var colEl = el('div', {
          className: 'ff-col' + (isHidden ? ' ff-hidden' : ''),
          style: 'flex: 0 0 calc(' + widthPct + ' - 6px); max-width: calc(' + widthPct + ' - 6px);'
        });

        if (!isHidden) hasVisible = true;
        colEl.appendChild(this.renderField(col.fieldId, field));
        rowEl.appendChild(colEl);
      }

      if (hasVisible) wrapper.appendChild(rowEl);
    }

    // Navigation
    var nav = el('div', { className: 'ff-nav' });
    var self = this;

    if (isMulti && this.currentPage > 0) {
      nav.appendChild(el('button', {
        className: 'ff-btn ff-btn-secondary',
        type: 'button',
        onClick: function() { self.currentPage--; self.render(); }
      }, 'Back'));
    } else {
      nav.appendChild(el('span'));
    }

    var isLast = this.currentPage === pages.length - 1;
    var btnText = isLast ? 'Submit' : 'Next';
    nav.appendChild(el('button', {
      className: 'ff-btn ff-btn-primary',
      type: 'button',
      onClick: function() {
        if (isLast) self.submit();
        else self.nextPage();
      }
    }, btnText));

    wrapper.appendChild(nav);
  };

  FormForge.prototype.renderField = function(fieldId, field) {
    var self = this;
    var container = el('div', { className: 'ff-field' });

    // HTML block
    if (field.type === 'html') {
      container.className = 'ff-html-block';
      container.innerHTML = field.htmlContent || '';
      return container;
    }

    // Section divider
    if (field.type === 'divider' || field.type === 'section_divider') {
      var hr = el('hr', { className: 'ff-divider' });
      if (field.label) {
        container.appendChild(el('div', { className: 'ff-label', style: 'font-weight:600; margin-bottom:8px;' }, field.label));
      }
      container.appendChild(hr);
      return container;
    }

    // Hidden
    if (field.type === 'hidden') {
      return el('input', { type: 'hidden', name: fieldId, value: this.fieldValues[fieldId] || field.defaultValue || '' });
    }

    // Label
    if (field.label) {
      var label = el('label', { className: 'ff-label', for: 'ff-' + fieldId });
      label.appendChild(document.createTextNode(field.label));
      if (field.required) label.appendChild(el('span', { className: 'ff-required' }, ' *'));
      container.appendChild(label);
    }

    var errorClass = this.fieldErrors[fieldId] ? ' ff-error-input' : '';

    var inputEl;
    switch (field.type) {
      case 'textarea':
        inputEl = el('textarea', {
          className: 'ff-textarea' + errorClass,
          id: 'ff-' + fieldId,
          name: fieldId,
          placeholder: field.placeholder || '',
          onInput: function(e) { self.fieldValues[fieldId] = e.target.value; self.onFieldChange(fieldId); }
        });
        if (this.fieldValues[fieldId]) inputEl.value = this.fieldValues[fieldId];
        container.appendChild(inputEl);
        break;

      case 'select':
        inputEl = el('select', {
          className: 'ff-select' + errorClass,
          id: 'ff-' + fieldId,
          name: fieldId,
          onChange: function(e) { self.fieldValues[fieldId] = e.target.value; self.onFieldChange(fieldId); }
        });
        inputEl.appendChild(el('option', { value: '' }, field.placeholder || 'Select...'));
        if (field.options) {
          for (var i = 0; i < field.options.length; i++) {
            var opt = el('option', { value: field.options[i].value }, field.options[i].label);
            if (this.fieldValues[fieldId] === field.options[i].value) opt.selected = true;
            inputEl.appendChild(opt);
          }
        }
        container.appendChild(inputEl);
        break;

      case 'multi_select':
        inputEl = el('select', {
          className: 'ff-select ff-multi-select' + errorClass,
          id: 'ff-' + fieldId,
          name: fieldId,
          multiple: 'multiple',
          onChange: function(e) {
            var vals = [];
            for (var j = 0; j < e.target.options.length; j++) {
              if (e.target.options[j].selected) vals.push(e.target.options[j].value);
            }
            self.fieldValues[fieldId] = vals;
            self.onFieldChange(fieldId);
          }
        });
        var selected = this.fieldValues[fieldId] || [];
        if (field.options) {
          for (var i2 = 0; i2 < field.options.length; i2++) {
            var opt2 = el('option', { value: field.options[i2].value }, field.options[i2].label);
            if (selected.indexOf(field.options[i2].value) !== -1) opt2.selected = true;
            inputEl.appendChild(opt2);
          }
        }
        container.appendChild(inputEl);
        break;

      case 'radio':
        var radioGroup = el('div', { className: 'ff-radio-group' });
        if (field.options) {
          for (var r = 0; r < field.options.length; r++) {
            (function(opt) {
              var radio = el('input', {
                type: 'radio',
                name: fieldId,
                value: opt.value
              });
              if (self.fieldValues[fieldId] === opt.value) radio.checked = true;
              radio.addEventListener('change', function() {
                self.fieldValues[fieldId] = opt.value;
                self.onFieldChange(fieldId);
              });
              radioGroup.appendChild(el('label', { className: 'ff-radio-label' }, [radio, opt.label]));
            })(field.options[r]);
          }
        }
        container.appendChild(radioGroup);
        break;

      case 'checkbox':
        var cbGroup = el('div', { className: 'ff-checkbox-group' });
        var currentVals = Array.isArray(this.fieldValues[fieldId]) ? this.fieldValues[fieldId] : [];
        if (field.options) {
          for (var cb = 0; cb < field.options.length; cb++) {
            (function(opt) {
              var checkbox = el('input', {
                type: 'checkbox',
                name: fieldId,
                value: opt.value
              });
              if (currentVals.indexOf(opt.value) !== -1) checkbox.checked = true;
              checkbox.addEventListener('change', function() {
                var arr = Array.isArray(self.fieldValues[fieldId]) ? self.fieldValues[fieldId].slice() : [];
                if (checkbox.checked) {
                  arr.push(opt.value);
                } else {
                  arr = arr.filter(function(v) { return v !== opt.value; });
                }
                self.fieldValues[fieldId] = arr;
                self.onFieldChange(fieldId);
              });
              cbGroup.appendChild(el('label', { className: 'ff-checkbox-label' }, [checkbox, opt.label]));
            })(field.options[cb]);
          }
        }
        container.appendChild(cbGroup);
        break;

      case 'file':
        inputEl = el('input', {
          className: 'ff-file-input' + errorClass,
          type: 'file',
          id: 'ff-' + fieldId,
          name: fieldId,
          onChange: function(e) {
            self.fieldValues[fieldId] = e.target.files && e.target.files[0] ? e.target.files[0].name : '';
            self.onFieldChange(fieldId);
          }
        });
        container.appendChild(inputEl);
        break;

      case 'date':
        inputEl = el('input', {
          className: 'ff-input' + errorClass,
          type: 'date',
          id: 'ff-' + fieldId,
          name: fieldId,
          value: this.fieldValues[fieldId] || '',
          onInput: function(e) { self.fieldValues[fieldId] = e.target.value; self.onFieldChange(fieldId); }
        });
        container.appendChild(inputEl);
        break;

      default:
        // text, email, phone, number
        var inputType = 'text';
        if (field.type === 'email') inputType = 'email';
        else if (field.type === 'number') inputType = 'number';
        else if (field.type === 'phone') inputType = 'tel';

        inputEl = el('input', {
          className: 'ff-input' + errorClass,
          type: inputType,
          id: 'ff-' + fieldId,
          name: fieldId,
          placeholder: field.placeholder || '',
          value: this.fieldValues[fieldId] || '',
          onInput: function(e) { self.fieldValues[fieldId] = e.target.value; self.onFieldChange(fieldId); }
        });
        container.appendChild(inputEl);
        break;
    }

    // Error message
    var errEl = el('div', {
      className: 'ff-error',
      id: 'ff-err-' + fieldId
    }, this.fieldErrors[fieldId] || '');
    container.appendChild(errEl);

    return container;
  };

  FormForge.prototype.clearError = function(fieldId) {
    if (this.fieldErrors[fieldId]) {
      delete this.fieldErrors[fieldId];
      var errEl = document.getElementById('ff-err-' + fieldId);
      if (errEl) errEl.textContent = '';
      var input = document.getElementById('ff-' + fieldId);
      if (input) input.classList.remove('ff-error-input');
    }
  };

  FormForge.prototype.onFieldChange = function(fieldId) {
    this.clearError(fieldId);
    // Re-evaluate conditions and re-render if visibility changed
    if (this.data && this.data.definition && this.data.definition.conditions && this.data.definition.conditions.length) {
      this.render();
    }
  };

  FormForge.prototype.validateCurrentPage = function() {
    var def = this.data.definition;
    var page = def.pages[this.currentPage];
    var condResult = evalConditions(def.conditions, this.fieldValues);
    var hidden = condResult.hidden;
    var valid = true;
    this.fieldErrors = {};

    for (var r = 0; r < page.rows.length; r++) {
      var row = page.rows[r];
      for (var c = 0; c < row.columns.length; c++) {
        var col = row.columns[c];
        if (hidden[col.fieldId]) continue;
        var field = def.fields[col.fieldId];
        if (!field) continue;
        if (field.type === 'html' || field.type === 'divider' || field.type === 'section_divider' || field.type === 'hidden') continue;

        var val = this.fieldValues[col.fieldId];
        if (field.type === 'checkbox' || field.type === 'multi_select') {
          val = Array.isArray(val) && val.length > 0 ? val : '';
        }

        var err = validateField(field, val);
        if (err) {
          this.fieldErrors[col.fieldId] = err;
          valid = false;
        }
      }
    }

    if (!valid) this.render();
    return valid;
  };

  FormForge.prototype.nextPage = function() {
    if (!this.validateCurrentPage()) return;
    var def = this.data.definition;
    var condResult = evalConditions(def.conditions, this.fieldValues);
    if (condResult.skipToPage !== null && condResult.skipToPage >= 0 && condResult.skipToPage < def.pages.length) {
      this.currentPage = condResult.skipToPage;
    } else {
      this.currentPage++;
    }
    this.render();
  };

  FormForge.prototype.submit = function() {
    if (!this.validateCurrentPage()) return;

    var self = this;
    var submitBtn = this.container.querySelector('.ff-btn-primary');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    // Build fields payload (skip hidden/html/divider, flatten arrays)
    var fields = {};
    var def = this.data.definition;
    var condResult = evalConditions(def.conditions, this.fieldValues);
    var hidden = condResult.hidden;

    for (var id in def.fields) {
      if (hidden[id]) continue;
      var f = def.fields[id];
      if (f.type === 'html' || f.type === 'divider' || f.type === 'section_divider') continue;
      var val = this.fieldValues[id];
      if (val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
        fields[id] = Array.isArray(val) ? val.join(', ') : val;
      }
    }

    fetch(baseUrl + '/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embedKey: this.embedKey, fields: fields })
    })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          self.container.innerHTML = '';
          self.container.appendChild(el('div', { className: 'ff-form' }, [
            el('div', { className: 'ff-thank-you' }, [
              el('h3', null, 'Thank you!'),
              el('p', null, 'Your submission has been received.')
            ])
          ]));
        }
      })
      .catch(function() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
        alert('Something went wrong. Please try again.');
      });
  };

  // ── Initialize ────────────────────────────────────────────────────────
  function init() {
    // Find all elements with data-formforge attribute
    var targets = document.querySelectorAll('[data-formforge]');
    for (var i = 0; i < targets.length; i++) {
      var key = targets[i].getAttribute('data-formforge');
      if (key) new FormForge(targets[i], key);
    }

    // Also find script tags with data-form attribute
    var scriptTags = document.querySelectorAll('script[data-form]');
    for (var j = 0; j < scriptTags.length; j++) {
      var formKey = scriptTags[j].getAttribute('data-form');
      if (formKey) {
        var div = document.createElement('div');
        scriptTags[j].parentNode.insertBefore(div, scriptTags[j]);
        new FormForge(div, formKey);
      }
    }
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
