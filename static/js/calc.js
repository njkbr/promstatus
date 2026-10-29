/* Калькулятор баллов по разделу XVII приложения к ПП №719 (ред. от 15.10.2026, ПП №1026, ПП №1077).
   Ориентировочный расчёт. Итог определяет ТПП. */
(function () {
  'use strict';

  // type: 'op' — операция (галочка, полные баллы);
  //       'share' — материал, баллы = максимум × доля российских позиций (формула сноски <58>).
  var GROUPS = [
    {
      id: 'sport',
      cat: 'Одежда',
      name: 'Одежда для спортсменов',
      code: 'из 14.19.12, из 14.19.22',
      min: 50,
      noLabel: 'без утеплителя',
      flags: [{ id: 'warm', q: 'Изделие с утеплителем?', add: 15, label: 'с утеплителем' }],
      items: [
        { id: 'sew', type: 'op', name: 'Раскрой и пошив или вязание в России', pts: 50 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя в России (если предусмотрено НТД) или утеплитель российского производства', pts: 15, flag: 'warm', hint: 'Импортный утеплитель тоже может дать баллы, если пакет изготавливается в России. Проверим на экспресс-аудите.' },
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
      cat: 'Одежда',
      name: 'Спецодежда, форменная одежда, униформа, школьная форма, огнестойкая одежда',
      code: '14.12, из 14.13, 32.99.11.140',
      min: 80,
      noLabel: 'без утеплителя',
      flags: [{ id: 'warm', q: 'Изделие с утеплителем?', add: 20, label: 'с утеплителем' }],
      items: [
        { id: 'fab', type: 'op', name: 'Ткани, полотна или кожа российского производства (или собственное производство)', pts: 40 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя в России (если предусмотрено НТД) или утеплитель российского производства', pts: 20, flag: 'warm', hint: 'Импортный утеплитель тоже может дать баллы, если пакет изготавливается в России. Проверим на экспресс-аудите.' },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив в России', pts: 40 }
      ],
      note: 'Требования в этой редакции действуют с 01.01.2027. Для изделий из тканей, полотен и кожи. Баллы за ленту для швов и российские нитки, фурнитуру, пряжу начисляются с 01.01.2030 (для вещевого имущества силовых ведомств с 01.01.2029), тогда же порог растёт до 100, с утеплителем 120.'
    },
    {
      id: 'under',
      cat: 'Одежда',
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
      cat: 'Одежда',
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
      id: 'shoe_cast',
      cat: 'Обувь',
      name: 'Обувь: литьевой метод крепления подошвы или вулканизация',
      code: '15.20.13, из 15.20.14, из 15.20.3',
      min: 80,
      items: [
        { id: 'cut', type: 'op', name: 'Раскрой всех деталей обуви (кроме вырубки подошв, каблуков, стелек) или вязание верха', pts: 35 },
        { id: 'upper', type: 'op', name: 'Сборка заготовок верха (пошив, сварка) или заготовки верха российского производства', pts: 20 },
        { id: 'sole', type: 'op', name: 'Крепление подошвы литьевым методом или вулканизацией', pts: 25 },
        { id: 'toe', type: 'op', name: 'Затяжка, формование, установка ударопрочных носков (если предусмотрено НТД)', pts: 5 },
        { id: 'insole', type: 'op', name: 'Производство стелек или российские стельки (если предусмотрено НТД)', pts: 5 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя (в т.ч. в ламинированном пакете с мембраной) или российский утеплитель (если предусмотрено НТД)', pts: 20 }
      ],
      note: 'Порог 80 баллов действует до 31.12.2027. С 01.01.2028 – 90, для утеплённой обуви 110, и добавляются баллы за российские материалы верха, носки, шнурки, полиуретан и резину.'
    },
    {
      id: 'shoe_glue',
      cat: 'Обувь',
      name: 'Обувь: клеевой, рантовый, прошивной и другие методы крепления',
      code: '15.20.13, из 15.20.14, из 15.20.3',
      min: 80,
      items: [
        { id: 'cut', type: 'op', name: 'Раскрой всех деталей обуви (кроме вырубки подошв, каблуков, стелек) или вязание верха', pts: 35 },
        { id: 'upper', type: 'op', name: 'Сборка заготовок верха (пошив, сварка) или заготовки верха российского производства', pts: 20 },
        { id: 'soleparts', type: 'op', name: 'Вырубка подошв, изготовление накладок, каблуков или российские подошвы и каблуки', pts: 10 },
        { id: 'sole', type: 'op', name: 'Крепление подошвы клеевым, рантовым, прошивным или другим методом', pts: 15 },
        { id: 'toe', type: 'op', name: 'Затяжка, формование, установка ударопрочных носков (если предусмотрено НТД)', pts: 5 },
        { id: 'insole', type: 'op', name: 'Производство стелек или российские стельки (если предусмотрено НТД)', pts: 5 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя (в т.ч. в ламинированном пакете с мембраной) или российский утеплитель (если предусмотрено НТД)', pts: 20 }
      ],
      note: 'Порог 80 баллов действует до 31.12.2027. С 01.01.2028 – 90, для утеплённой обуви 110, и добавляются баллы за российские материалы верха, носки, шнурки, полиуретан и резину.'
    },
    {
      id: 'shoe_rubber',
      cat: 'Обувь',
      name: 'Обувь с верхом и подошвой из резины или пластмассы (цельнолитьевая)',
      code: '15.20.11, 15.20.12',
      min: 80,
      items: [
        { id: 'cast', type: 'op', name: 'Литьё обуви', pts: 80 },
        { id: 'toe', type: 'op', name: 'Установка ударопрочных носков (если предусмотрено НТД, для 15.20.12)', pts: 5 },
        { id: 'insole', type: 'op', name: 'Производство стелек или российские стельки (если предусмотрено НТД)', pts: 5 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя или российский утеплитель (если предусмотрено НТД)', pts: 20 }
      ],
      note: 'С 01.01.2028 добавляются баллы за российские полиуретан, резину, ПВХ, ЭВА и синтетический каучук. Для нецельнолитьевой обуви 15.20.12 свой набор операций – проверим на аудите.'
    },
    {
      id: 'shoe_felt', cat: 'Обувь',
      name: 'Обувь валяная, в том числе детская',
      code: '15.20.14.130, 15.20.14.143',
      min: 60,
      items: [
        { id: 'comb', type: 'op', name: 'Расчёс шерсти', pts: 40 },
        { id: 'form', type: 'op', name: 'Формирование валяной обуви', pts: 5 },
        { id: 'wash', type: 'op', name: 'Стирка и покраска (при необходимости)', pts: 10 },
        { id: 'dry', type: 'op', name: 'Насадка и сушка', pts: 5 }
      ],
      note: 'С 01.01.2028 добавляются баллы за российскую шерсть. Обувь из войлока, детская войлочная, обувь для боксёров и борцов, лыжные ботинки и коньки считаются по своим наборам операций – проверим на аудите.'
    },
    {
      id: 'blanket', cat: 'Домашний текстиль и сумки',
      name: 'Одеяла, пледы, спальные мешки из тканей и полотен',
      code: '13.92.11, из 13.92.24',
      min: 60,
      noLabel: 'без наполнителя и вкладыша',
      flags: [{ id: 'fill', q: 'Есть наполнитель (утеплитель, пух, перо)?', add: 20, label: 'с наполнителем' },
              { id: 'liner', q: 'Есть вкладыш (для спальных мешков)?', add: 15, label: 'с вкладышем' }],
      items: [
        { id: 'fab', type: 'op', name: 'Производство тканей или полотен либо ткани и полотна российского производства', pts: 40 },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив в России', pts: 20 },
        { id: 'warm', type: 'op', name: 'Производство утеплителя или российский утеплитель', pts: 20, flag: 'fill' },
        { id: 'down', type: 'op', name: 'Набивка пухом и (или) пером', pts: 20, flag: 'fill' },
        { id: 'liner', type: 'op', name: 'Производство вкладыша или российский вкладыш', pts: 15, flag: 'liner' },
        { id: 'yarn', type: 'share', name: 'Российские пряжа, мембрана, покрытие, клей', pts: 15 },
        { id: 'fabyarn', type: 'share', name: 'Ткани из российской пряжи', pts: 15 },
        { id: 'thr', type: 'share', name: 'Российские швейные нитки', pts: 10 },
        { id: 'acc', type: 'share', name: 'Российская фурнитура', pts: 20 },
        { id: 'tapes', type: 'op', name: 'Российские ленты для герметизации швов', pts: 10 }
      ],
      note: 'Требования действуют с 01.01.2027. Для изделий из нетканых и комбинированных материалов свой набор операций – проверим на аудите. С 01.01.2030 пороги растут до 80–115.'
    },
    {
      id: 'curtain', cat: 'Домашний текстиль и сумки',
      name: 'Шторы и занавеси из тканей',
      code: 'из 13.92.15, из 13.92.22.120',
      min: 60,
      items: [
        { id: 'fab', type: 'op', name: 'Производство тканей (в т.ч. с покрытием, ламинированных) или российские ткани', pts: 40 },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив, сварка или клеевое соединение деталей', pts: 20 },
        { id: 'thr', type: 'share', name: 'Российские швейные нитки', pts: 10 },
        { id: 'acc', type: 'share', name: 'Российская фурнитура', pts: 20 }
      ],
      note: 'Требования действуют с 01.01.2027. С 01.01.2030 порог 75. Для штор из нетканых и комбинированных материалов свой набор операций.'
    },
    {
      id: 'sacks', cat: 'Домашний текстиль и сумки',
      name: 'Мешки и упаковка из полипропиленовых и полиэтиленовых нитей',
      code: 'из 13.92.21.110, из 13.92.21.190, из 22.22.12.130',
      min: 65,
      noLabel: 'без вкладыша',
      flags: [{ id: 'liner', q: 'Есть полиэтиленовый вкладыш?', add: 10, label: 'с вкладышем' }],
      items: [
        { id: 'fab', type: 'op', name: 'Производство тканей или ткани российского производства', pts: 40 },
        { id: 'sew', type: 'op', name: 'Раскрой и пошив', pts: 20 },
        { id: 'pack', type: 'op', name: 'Упаковка готовой продукции', pts: 5 },
        { id: 'liner', type: 'op', name: 'Изготовление полиэтиленового вкладыша или российский вкладыш', pts: 10, flag: 'liner' },
        { id: 'pe', type: 'op', name: 'Российский полиэтилен (сырьё)', pts: 10 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    },
    {
      id: 'bed',
      cat: 'Домашний текстиль и сумки',
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
      cat: 'Домашний текстиль и сумки',
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
,
    {
      id: 'wool_yarn', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Пряжа шерстяная', code: '13.10.50', min: 75,
      items: [
        { id: 'wash', type: 'op', name: 'Мойка шерсти или первично обработанная российская шерсть', pts: 25 },
        { id: 'comb', type: 'op', name: 'Гребнечесание (топс) или российский топс', pts: 25 },
        { id: 'spin', type: 'op', name: 'Прядение', pts: 25 },
        { id: 'dye', type: 'op', name: 'Крашение', pts: 25 }
      ],
      note: ''
    },
    {
      id: 'wool_fab', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Ткани шерстяные', code: 'из 13.20.12', min: 75,
      items: [
        { id: 'comb', type: 'op', name: 'Гребнечесание (топс) или российский топс', pts: 25 },
        { id: 'spin', type: 'op', name: 'Прядение или российская пряжа', pts: 25 },
        { id: 'weave', type: 'op', name: 'Ткачество', pts: 25 },
        { id: 'dye', type: 'op', name: 'Крашение (если есть), отделка', pts: 25 }
      ],
      note: ''
    },
    {
      id: 'linen', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Ткани льняные', code: '13.20.13', min: 50,
      items: [
        { id: 'fiber', type: 'op', name: 'Обработка льняного волокна или котонизация (либо российское волокно)', pts: 25 },
        { id: 'spin', type: 'op', name: 'Прядение или российская пряжа', pts: 25 },
        { id: 'weave', type: 'op', name: 'Ткачество', pts: 25 },
        { id: 'dye', type: 'op', name: 'Крашение и (или) печать, отделка (если есть)', pts: 25 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    },
    {
      id: 'pp_fab', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Ткани из полипропиленовых плоских нитей (не менее 85%)', code: 'из 13.20.31.123', min: 60,
      items: [
        { id: 'yarn', type: 'op', name: 'Производство плоских нитей экструзией, вытяжкой и резкой', pts: 20 },
        { id: 'weave', type: 'op', name: 'Ткачество', pts: 20 },
        { id: 'pp', type: 'op', name: 'Российские гранулы полипропилена', pts: 20 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    },
    {
      id: 'knit', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Полотна трикотажные, ворсовые, махровые', code: '13.91.11, из 13.91.19', min: 40,
      items: [
        { id: 'yarn', type: 'op', name: 'Прядение (формование) или российская пряжа (нити)', pts: 20 },
        { id: 'knit', type: 'op', name: 'Вязание', pts: 40 },
        { id: 'dye', type: 'op', name: 'Крашение и (или) печать, отделка (если есть)', pts: 10 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    },
    {
      id: 'fleece', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Полотна флисовые', code: '13.91.11, из 13.91.19', min: 40,
      items: [
        { id: 'yarn', type: 'op', name: 'Прядение (формование) или российская пряжа (нити)', pts: 20 },
        { id: 'knit', type: 'op', name: 'Вязание', pts: 20 },
        { id: 'brush', type: 'op', name: 'Ворсование (начёс)', pts: 10 },
        { id: 'pill', type: 'op', name: 'Антипиллинговая обработка (вычёсывание, стрижка, завивка ворса)', pts: 10 },
        { id: 'dye', type: 'op', name: 'Крашение и (или) печать, отделка (если есть)', pts: 10 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    },
    {
      id: 'coated', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Ткани с покрытием и пропиткой (ПВХ, полиуретан и др.)', code: '13.96.14.112, .121, .122, .190, .199', min: 60,
      items: [
        { id: 'yarn', type: 'op', name: 'Прядение (формование) или российская пряжа (нити)', pts: 20 },
        { id: 'weave', type: 'op', name: 'Ткачество', pts: 20 },
        { id: 'dye', type: 'op', name: 'Крашение и (или) печать, отделка (если есть)', pts: 10 },
        { id: 'rufab', type: 'op', name: 'Российские ткани (если ткань не ткёте сами)', pts: 30 },
        { id: 'coat', type: 'op', name: 'Нанесение покрытия', pts: 30 }
      ],
      note: 'Если ткань своя, отмечайте прядение, ткачество и отделку, если покупная российская – пункт «Российские ткани». С 01.01.2029 добавляются баллы за российское покрытие. Трикотажные полотна с покрытием, нетканые и ламинированные материалы считаются по своим наборам операций.'
    },
    {
      id: 'leather', cat: 'Ткани, полотна, пряжа, кожа',
      name: 'Кожа дублёная и выделанная', code: 'из 15.11', min: 30,
      items: [
        { id: 'soak', type: 'op', name: 'Отмока, золение', pts: 5 },
        { id: 'tan', type: 'op', name: 'Дубление', pts: 10 },
        { id: 'dye', type: 'op', name: 'Крашение, жирование, сушка', pts: 15 },
        { id: 'top', type: 'op', name: 'Покрывное крашение (если есть)', pts: 5 },
        { id: 'emb', type: 'op', name: 'Тиснение (если есть)', pts: 5 }
      ],
      note: 'Требования действуют с 01.01.2027.'
    }
  ];

  var root = document.getElementById('calc');
  if (!root) return;
  var sel = root.querySelector('[data-calc-group]');
  var list = root.querySelector('[data-calc-items]');
  var ntd = root.querySelector('[data-calc-ntd]');
  var flagsBox = root.querySelector('[data-calc-flags]');
  function flagOn(id) { var r = flagsBox.querySelector('input[name="flag-' + id + '"]:checked'); return !!(r && r.value === '1'); }
  var out = {
    total: root.querySelector('[data-calc-total]'),
    min: root.querySelector('[data-calc-min]'),
    verdict: root.querySelector('[data-calc-verdict]'),
    code: root.querySelector('[data-calc-code]'),
    note: root.querySelector('[data-calc-note]'),
    warn: root.querySelector('[data-calc-warn]'),
    minnote: root.querySelector('[data-calc-minnote]')
  };

  var cats = {};
  GROUPS.forEach(function (g) {
    var c = g.cat || 'Прочее';
    if (!cats[c]) { cats[c] = document.createElement('optgroup'); cats[c].label = c; sel.appendChild(cats[c]); }
    var o = document.createElement('option');
    o.value = g.id; o.textContent = g.name;
    cats[c].appendChild(o);
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
      if (it.flag) { input.dataset.flag = it.flag; row.dataset.flag = it.flag; }
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
    flagsBox.textContent = '';
    (g.flags || []).forEach(function (f) {
      var fs = document.createElement('fieldset');
      fs.className = 'calc-warmq';
      var lg = document.createElement('legend'); lg.textContent = f.q; fs.appendChild(lg);
      [['0', 'Нет'], ['1', 'Да']].forEach(function (o) {
        var l = document.createElement('label');
        var r = document.createElement('input'); r.type = 'radio'; r.name = 'flag-' + f.id; r.value = o[0]; if (o[0] === '0') r.checked = true;
        l.appendChild(r); l.appendChild(document.createTextNode(' ' + o[1])); fs.appendChild(l);
      });
      var n = document.createElement('p'); n.className = 'muted small'; n.textContent = 'Порог выше на ' + f.add + ' баллов.'; fs.appendChild(n);
      flagsBox.appendChild(fs);
    });
    out.code.textContent = 'ОКПД2: ' + g.code;
    out.note.textContent = g.note;
    out.note.hidden = !g.note;
    update();
  }

  function update() {
    var g = GROUPS.filter(function (x) { return x.id === sel.value; })[0] || GROUPS[0];
    var total = 0, min = g.min, on = [];
    (g.flags || []).forEach(function (f) { if (flagOn(f.id)) { min += f.add; on.push(f.label); } });
    list.querySelectorAll('.calc-row[data-flag]').forEach(function (el) { el.hidden = !flagOn(el.dataset.flag); });
    list.querySelectorAll('input').forEach(function (inp) {
      var p = Number(inp.dataset.pts);
      if (inp.dataset.flag && !flagOn(inp.dataset.flag)) { inp.checked = false; if (inp.type === 'number') inp.value = 0; return; }
      if (inp.dataset.type === 'op') {
        if (inp.checked) { total += p; }
      } else {
        var share = Math.max(0, Math.min(100, Number(inp.value) || 0)) / 100;
        total += Math.round(p * share * 100) / 100;
      }
    });
    total = Math.round(total * 100) / 100;
    out.total.textContent = String(total).replace('.', ',');
    out.min.textContent = min;
    out.minnote.textContent = g.flags ? 'Порог ' + min + (on.length ? ' – для изделий ' + on.join(' и ') : ' – для изделий ' + (g.noLabel || 'без доп. условий')) : '';
    var ok = total >= min && ntd.checked;
    out.verdict.textContent = !ntd.checked
      ? 'нужны права на техническую документацию'
      : (ok ? 'проходит порог' : 'не хватает ' + String(Math.round((min - total) * 100) / 100).replace('.', ',') + ' баллов');
    out.verdict.className = 'calc-verdict ' + (ok ? 'is-ok' : 'is-no');
    var zero = ok && total === min;
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
  flagsBox.addEventListener('change', update);
  render();
})();
