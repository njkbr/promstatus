/* Калькулятор баллов по разделу XVII приложения к ПП №719 (ред. от 15.10.2026).
   Ориентировочный расчёт. Итог определяет ТПП. */
(function () {
  'use strict';

  // type: 'op' — операция (галочка, полные баллы);
  //       'share' — материал, баллы = максимум × доля российских позиций (формула сноски <58>).
  var GROUPS = [
    {
      id: 'sport',
      name: 'Одежда для спортсменов',
      code: 'из 14.19.12, из 14.19.22',
      min: 50, minWarm: 65,
      items: [
        { id: 'sew', type: 'op', name: 'Раскрой и пошив или вязание в России', pts: 50 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя в России (если предусмотрено НТД) или утеплитель российского производства', pts: 15, warm: true, hint: 'Импортный утеплитель тоже может дать баллы, если пакет изготавливается в России. Проверим на экспресс-аудите.' },
        { id: 'down', type: 'op', name: 'Набивка пухом и (или) пером (если есть)', pts: 15 },
        { id: 'tape', type: 'op', name: 'Дублирование лентой для герметизации швов (если есть)', pts: 10 },
        { id: 'fab', type: 'share', name: 'Российские ткани и полотна', pts: 15 },
        { id: 'thr', type: 'share', name: 'Российские швейные нитки', pts: 10 },
        { id: 'acc', type: 'share', name: 'Российская фурнитура (молнии, кнопки, пуговицы, шнуры и др.)', pts: 20 },
        { id: 'tapes', type: 'op', name: 'Российские ленты для герметизации швов', pts: 10 }
      ],
      note: 'Требования действуют с 01.01.2027, баллы за российские материалы учитываются сразу. С 01.01.2030 порог 65 баллов, с утеплителем 80.'
    },
    {
      id: 'spec',
      name: 'Спецодежда, форменная одежда, униформа, школьная форма, огнестойкая одежда',
      code: '14.12, из 14.13, 32.99.11.140',
      min: 80, minWarm: 100,
      items: [
        { id: 'fab', type: 'op', name: 'Ткани, полотна или кожа российского производства (или собственное производство)', pts: 40 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя в России (если предусмотрено НТД) или утеплитель российского производства', pts: 20, warm: true, hint: 'Импортный утеплитель тоже может дать баллы, если пакет изготавливается в России. Проверим на экспресс-аудите.' },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив в России', pts: 40 }
      ],
      note: 'Требования в этой редакции действуют с 01.01.2027. Для изделий из тканей, полотен и кожи. Баллы за ленту для швов и российские нитки, фурнитуру, пряжу начисляются с 01.01.2030 (для вещевого имущества силовых ведомств с 01.01.2029), тогда же порог растёт до 100, с утеплителем 120.'
    },
    {
      id: 'under',
      name: 'Нательное нижнее бельё',
      code: 'из 14.14, из 14.19',
      min: 60,
      items: [
        { id: 'fab', type: 'op', name: 'Ткани или трикотажные полотна российского производства (или собственное производство)', pts: 40 },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив или вязание в России', pts: 20 }
      ],
      note: 'Требования действуют с 01.01.2027. Баллы за российские нитки и фурнитуру начисляются с 01.01.2030 (для вещевого имущества с 01.01.2029), порог растёт до 70.'
    },
    {
      id: 'socks',
      name: 'Чулочно-носочные изделия',
      code: 'из 14.31.10',
      min: 35,
      items: [
        { id: 'knit', type: 'op', name: 'Вязание в России', pts: 30 },
        { id: 'toe', type: 'op', name: 'Зашив мыска', pts: 5 },
        { id: 'elas', type: 'op', name: 'Пришив резинки (если есть)', pts: 5 },
        { id: 'gus', type: 'op', name: 'Вшивание ластовицы (если есть)', pts: 5 },
        { id: 'dye', type: 'op', name: 'Крашение (если есть)', pts: 15 },
        { id: 'yarn', type: 'share', name: 'Российская пряжа (нити)', pts: 10 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    },
    {
      id: 'bed',
      name: 'Постельное, столовое, туалетное и кухонное бельё',
      code: '13.92.12, 13.92.13, 13.92.14',
      min: 60,
      items: [
        { id: 'fab', type: 'op', name: 'Ткани или полотна российского производства (или собственное производство)', pts: 40 },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив в России', pts: 20 }
      ],
      note: 'Требования в этой редакции действуют с 01.01.2027. Для изделий из тканей и полотен. Баллы за российские материалы начисляются с 01.01.2030 (для вещевого имущества с 01.01.2029), порог растёт до 65.'
    },
    {
      id: 'bags',
      name: 'Баулы, сумки (в том числе спортивные), рюкзаки',
      code: 'из 13.92, из 15.12.12',
      min: 60,
      items: [
        { id: 'fab', type: 'op', name: 'Ткани или кожа российского производства (или собственное производство)', pts: 40 },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив, сварка или клеевое соединение деталей в России', pts: 20 },
        { id: 'fin', type: 'op', name: 'Крашение, печать, отделка, нанесение покрытия или ламинация (если есть)', pts: 5 }
      ],
      note: 'Требования действуют с 01.01.2027. Для изделий из тканей и кожи. Баллы за российские материалы начисляются с 01.01.2030 (для вещевого имущества с 01.01.2029), порог растёт до 80.'
    }
  ];

  var root = document.getElementById('calc');
  if (!root) return;
  var sel = root.querySelector('[data-calc-group]');
  var list = root.querySelector('[data-calc-items]');
  var ntd = root.querySelector('[data-calc-ntd]');
  var out = {
    total: root.querySelector('[data-calc-total]'),
    min: root.querySelector('[data-calc-min]'),
    verdict: root.querySelector('[data-calc-verdict]'),
    code: root.querySelector('[data-calc-code]'),
    note: root.querySelector('[data-calc-note]'),
    warn: root.querySelector('[data-calc-warn]')
  };

  GROUPS.forEach(function (g) {
    var o = document.createElement('option');
    o.value = g.id; o.textContent = g.name;
    sel.appendChild(o);
  });

  function render() {
    var g = GROUPS.filter(function (x) { return x.id === sel.value; })[0] || GROUPS[0];
    list.textContent = '';
    g.items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'calc-row';
      var label = document.createElement('label');
      var id = 'c-' + g.id + '-' + it.id;
      label.setAttribute('for', id);
      label.textContent = it.name;
      var pts = document.createElement('span');
      pts.className = 'calc-pts';
      var input = document.createElement('input');
      input.id = id;
      input.dataset.pts = it.pts;
      input.dataset.type = it.type;
      if (it.warm) input.dataset.warm = '1';
      if (it.type === 'op') {
        input.type = 'checkbox';
        pts.textContent = it.pts;
        row.appendChild(input); row.appendChild(label);
      } else {
        input.type = 'number'; input.min = 0; input.max = 100; input.step = 5; input.value = 0;
        input.setAttribute('aria-label', it.name + ', доля российских позиций в процентах');
        var wrap = document.createElement('span');
        wrap.className = 'calc-share';
        wrap.appendChild(input);
        wrap.appendChild(document.createTextNode('%'));
        pts.textContent = 'до ' + it.pts;
        row.appendChild(wrap); row.appendChild(label);
        row.classList.add('calc-row--share');
      }
      row.appendChild(pts);
      if (it.hint) {
        var h = document.createElement('p');
        h.className = 'calc-hint small muted';
        h.textContent = it.hint;
        row.appendChild(h);
      }
      list.appendChild(row);
    });
    out.code.textContent = 'ОКПД2: ' + g.code;
    out.note.textContent = g.note;
    out.note.hidden = !g.note;
    update();
  }

  function update() {
    var g = GROUPS.filter(function (x) { return x.id === sel.value; })[0] || GROUPS[0];
    var total = 0, warm = false;
    list.querySelectorAll('input').forEach(function (inp) {
      var p = Number(inp.dataset.pts);
      if (inp.dataset.type === 'op') {
        if (inp.checked) { total += p; if (inp.dataset.warm) warm = true; }
      } else {
        var share = Math.max(0, Math.min(100, Number(inp.value) || 0)) / 100;
        total += Math.round(p * share * 100) / 100;
      }
    });
    total = Math.round(total * 100) / 100;
    var min = warm && g.minWarm ? g.minWarm : g.min;
    out.total.textContent = String(total).replace('.', ',');
    out.min.textContent = min;
    var ok = total >= min && ntd.checked;
    out.verdict.textContent = !ntd.checked
      ? 'нужны права на техническую документацию'
      : (ok ? 'проходит порог' : 'не хватает ' + String(Math.round((min - total) * 100) / 100).replace('.', ',') + ' баллов');
    out.verdict.className = 'calc-verdict ' + (ok ? 'is-ok' : 'is-no');
    var zero = ok && warm && total === min;
    out.warn.textContent = zero ? 'Запас 0 баллов. Если ТПП не засчитает один пункт, порог не пройден. Добавьте проклейку швов (если она есть в НТД) или российские нитки.' : '';
    out.warn.hidden = !zero;
  }

  sel.addEventListener('change', render);
  var goalSent = false;
  function goal() { if (!goalSent && window.psGoal) { goalSent = true; window.psGoal('calc_used'); } }
  list.addEventListener('change', goal);
  list.addEventListener('input', update);
  list.addEventListener('change', update);
  ntd.addEventListener('change', update);
  render();
})();
