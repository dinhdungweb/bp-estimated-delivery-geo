/**
 * BP: Estimated Delivery & Geo — App Embed Rendering Engine (MIRROR-LOGIC)
 * A 1:1 functional port of WidgetRenderer.tsx for absolute parity.
 */
(function() {
  'use strict';
  if (window.__bpDeliveryLoaded) return;
  window.__bpDeliveryLoaded = true;

  // ─── High-Fidelity SVG Icons (MIRROR-PARITY) ──────────────────────────
  var IconList = {
    bag: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M6 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/><path d="M9 6c0-1.657 1.343-3 3-3s3 1.343 3 3"/><path d="M6 10h12"/><circle cx="9" cy="14" r="1.5" fill="'+c+'"/><circle cx="15" cy="14" r="1.5" fill="'+c+'"/></svg>'; },
    truck: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h2.5"/><path d="M11.5 17h3.5"/><path d="M21 17h-1.5v-5a1 1 0 0 0-1-1H14"/><path d="M14 17h5l1.5-3.5V11H14V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11h3"/></svg>'; },
    truck_mini: function(c, s) { return '<svg width="'+(s||16)+'" height="'+(s||16)+'" viewBox="0 0 24 24" fill="'+c+'"><path d="M19 10h-2V7c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v10h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-2zm-13 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>'; },
    heart: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="'+c+'"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'; },
    map_pin: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="'+c+'"/></svg>'; },
    package: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M12 3L4 8v8l8 5 8-5V8l-8-5z"/><path d="M4 8l8 5 8-5"/><path d="M12 21V13"/></svg>'; },
    box: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>'; },
    scooter: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 18h8"/><path d="M18 18h1c1.1 0 2-.9 2-2V7a2 2 0 0 0-2-2h-3"/><path d="M12 11h6V5h-6z"/><path d="M12 5V2"/><path d="M12 17V8c0-1.1-.9-2-2-2H2v3h6v8"/></svg>'; },
    monitor: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4"/><path d="M8 20h8"/></svg>'; },
    store: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M2.2 7.3h19.6l-1 4.4H3.2l-1-4.4z"/><path d="M5.5 11.7V21h13V11.7"/><path d="M10 21v-5h4v5"/></svg>'; },
    shield: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>'; },
    rocket: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.5-1 1-4c2 0 3 0 3 0"/><path d="M15 9V4s-1 .5-4 1c0 2 0 3 0 3"/></svg>'; },
    clock: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke="'+c+'"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'; },
    check_badge: function(c, s) { return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="'+c+'" style="transform:scale(1.1)"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>'; }
  };

  function getIcon(id, c, s) {
    if (!id) return '';
    var name = id.startsWith('lucide:') ? id.replace('lucide:', '').replace(/-/g, '_') : id;
    var render = IconList[name] || IconList.package;
    return render(c, s || 24);
  }

  var currentCountdown = "00:00:00";
  function startTimer(initialSecs) {
    var sec = initialSecs || 8100;
    var update = function() {
      if (sec > 0) sec--;
      var h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
      currentCountdown = (h<10?'0':'')+h + ":" + (m<10?'0':'')+m + ":" + (s<10?'0':'')+s;
      document.querySelectorAll('.bp-timer-val').forEach(function(el) { el.innerText = currentCountdown; });
    };
    update();
    setInterval(update, 1000);
  }

  function runWidgetFlow(SHOP, PRODUCT_ID, PRODUCT_TAGS, content, skeleton) {
    var renderWidget = function(config, container) {
      var s = config.settings || {};
      var blocks = s.customBlocks || config.customBlocks || s.blocks || config.blocks || [];
      var tc = s.textColor || "#1f2937";
      var ic = s.iconColor || "#3b82f6";
      var bg = s.bgGradient || s.bgColor || "#ffffff";
      var bc = s.borderColor || "#e5e7eb";
      var rad = s.borderRadius !== undefined ? s.borderRadius : 12;
      var pad = s.padding !== undefined ? s.padding : 16;
      var shadow = s.shadow || "none";

      var format = function(str) {
        if (!str) return '';
        var d = config || {};
        var res = str.replace(/{order_date}/g, d.orderDate || '')
                  .replace(/{ship_date}/g, d.shipDate || '')
                  .replace(/{min_date}/g, d.minDate || '')
                  .replace(/{max_date}/g, d.maxDate || '')
                  .replace(/{countdown}/g, '<span class="bp-timer-val">' + currentCountdown + '</span>')
                  .replace(/{COUNTRY_NAME}/g, d.countryName || 'your country')
                  .replace(/{COUNTRY_FLAG}/g, d.countryFlag || '📍');
        return res.replace(/00:00:00/g, ''); 
      };

      var html = '<div class="bp-widget bp-shadow-' + shadow + ' ' + (s.glassmorphism ? 'bp-glass' : '') + '" style="' +
        '--bp-tc: ' + tc + '; ' +
        '--bp-ic: ' + ic + '; ' +
        '--bp-bg: ' + (s.bgColor || '#fff') + '; ' +
        '--bp-bc: ' + bc + '; ' +
        '--bp-rad: ' + rad + 'px; ' +
        '--bp-pad: ' + pad + 'px; ' +
        'background: ' + bg + '; ' +
        (s.borderWidth ? ('border: ' + s.borderWidth + 'px solid ' + (s.borderColor || bc) + ';') : '') + '">';

      html += '<div class="bp-container">';

      blocks.forEach(function(block) {
        var b = block.settings || {};
        var type = block.type;

        if (type === 'header') {
          var isBanner = b.styleType === 'title_banner';
          var isH = b.iconPosition === 'left' || b.iconPosition === 'right';
          var align = b.align || 'center';
          
          html += '<div class="bp-header ' + (isBanner ? 'bp-header-banner' : '') + '" style="' +
            'background: ' + (isBanner ? (b.bgColor || '#fde047') : (b.bgColor || 'transparent')) + '; ' +
            'color: ' + (isBanner ? (b.textColor || '#000') : (b.textColor || 'inherit')) + '; ' +
            'border: ' + (b.borderWidth ? (b.borderWidth + 'px solid ' + (b.borderColor || bc)) : 'none') + '; ' +
            'border-radius: ' + (b.borderRadius !== undefined ? b.borderRadius : (isBanner ? 8 : 0)) + 'px; ' +
            'flex-direction: ' + (isH ? 'row' : 'column') + '; ' +
            'align-items: ' + (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center') + '; ' +
            'padding: ' + (b.padding !== undefined ? b.padding + 'px' : '') + '; ' +
            '--bp-size: ' + (b.iconSize || 24) + 'px;">';
          if ((b.iconPosition === 'top' || b.iconPosition === 'left') && b.icon) html += getIcon(b.icon, 'inherit', b.iconSize || 24);
          html += '<div style="display:flex; flex-direction:column; gap:2px; text-align:' + align + '">' +
            '<div class="bp-text-label" style="font-size:' + (b.fontSize === 'sm' ? '14px' : b.fontSize === 'lg' ? '20px' : 'inherit') + '">' + format(b.text) + '</div>' +
            (b.subText ? '<div class="bp-text-sub">' + format(b.subText) + '</div>' : '') +
          '</div>';
          if ((b.iconPosition === 'bottom' || b.iconPosition === 'right') && b.icon) html += getIcon(b.icon, 'inherit', b.iconSize || 24);
          html += '</div>';
        }

        else if (type === 'steps') {
          var preset = b.preset || 'horizontal';
          var pClass = 'bp-steps-' + preset.replace('_', '-');
          var items = [
            { l: b.step1Label || "Order", s: b.step1SubText || config.orderDate, i: b.step1Icon || "bag" },
            { l: b.step2Label || "Shipped", s: b.step2SubText || config.shipDate, i: b.step2Icon || "truck" },
            { l: b.step3Label || "Delivery", s: b.step3SubText || config.maxDate, i: b.step3Icon || "map_pin" }
          ];

          html += '<div class="bp-steps ' + pClass + '" style="--bp-size:' + (b.iconSize || 24) + 'px; --bp-gap:' + (b.itemGap || 16) + 'px;">';
          items.forEach(function(item, idx) {
            var isFirst = idx === 0;
            var isLast = idx === items.length - 1;
            var stepBg = b['step' + (idx + 1) + 'Bg'];
            var itemClass = 'bp-timeline-item';
            if (preset === 'vertical') itemClass = 'bp-vertical-item';
            else if (preset === 'boxed_cards' || preset === 'boxed_steps') itemClass = 'bp-card';
            else if (preset === 'split_segments' || preset === 'thick' || preset === 'chevron') itemClass = 'bp-segment';
            
            var hasItemBorder = (preset === 'boxed_cards' || preset === 'boxed_steps' || preset === 'split_segments');
            
            html += '<div class="' + itemClass + '" style="' +
              (stepBg ? ('background: ' + stepBg + '; ') : '') + 
              'border-radius: ' + (b.borderRadius !== undefined ? b.borderRadius + 'px' : '') + '; ' +
              (b.borderWidth && hasItemBorder ? ('border: ' + b.borderWidth + 'px solid ' + (isFirst ? ic : '#eee')) : '') + ';">';
            
            if (!isLast && (preset === 'timeline_dots' || preset === 'thick')) html += '<div class="bp-timeline-connector" style="border-top-style:' + (b.connectorStyle || 'dashed') + '; border-top-color:' + ic + '">&nbsp;</div>';
            if (!isLast && preset === 'vertical') html += '<div class="bp-vertical-connector" style="border-left-style:' + (b.connectorStyle || 'dashed') + '; border-left-color:' + ic + '">&nbsp;</div>';

            html += '<div class="bp-timeline-dot" style="background:' + (isFirst ? ic : '#fff') + '; border-color:' + (isFirst ? ic : '#eee') + '">' +
              getIcon(item.i, isFirst ? '#fff' : ic, b.iconSize || (preset === 'timeline_dots' ? 16 : 22)) +
            '</div>';

            html += '<div style="display:flex; flex-direction:column; gap:2px; text-align:' + (preset === 'vertical' ? 'left' : 'center') + '">' +
              '<div class="bp-text-label">' + format(item.l) + '</div>' +
              '<div class="bp-text-sub">' + format(item.s) + '</div>' +
            '</div>';
            html += '</div>';
          });
          html += '</div>';
        }

        else if (type === 'timer') {
          html += '<div class="bp-timer" style="background:' + (b.bgColor || 'rgba(0,0,0,0.03)') + '; color:' + (b.textColor || 'inherit') + '; --bp-ic:' + (b.color || ic) + ';">' +
            '<div class="bp-timer-dot">&nbsp;</div>' +
            '<div class="bp-text-label" style="font-weight:500">' +
              format(b.text) +
            '</div>' +
          '</div>';
        }

        else if (type === 'banner') {
          var bbg = '#e0f2fe'; var bbc = '#7dd3fc';
          if (b.type === 'success') { bbg = '#dcfce7'; bbc = '#86efac'; }
          if (b.type === 'warning') { bbg = '#fef9c3'; bbc = '#fde047'; }
          if (b.type === 'error') { bbg = '#fee2e2'; bbc = '#fca5a5'; }
          html += '<div class="bp-banner" style="background:' + (b.styleType === 'outline' ? 'transparent' : bbg) + '; border-color:' + bbc + '; text-align:' + (b.align || 'left') + '; color:' + (b.textColor || 'inherit') + '">' +
            (b.icon ? getIcon(b.icon, ic, 20) : '') +
            '<div style="flex:1">' + format(b.text) + '</div>' +
          '</div>';
        }

        else if (type === 'dual_info') {
          html += '<div class="bp-dual-info">' +
            '<div class="bp-dual-card">' +
              getIcon(b.leftIcon || "monitor", ic, 28) +
              '<div class="bp-text-label">' + format(b.leftTitle || "Online") + '</div>' +
              '<div class="bp-text-sub">' + format(b.leftText) + '</div>' +
            '</div>' +
            '<div class="bp-dual-card">' +
              getIcon(b.rightIcon || "store", ic, 28) +
              '<div class="bp-text-label">' + format(b.rightTitle || "In Store") + '</div>' +
              '<div class="bp-text-sub">' + format(b.rightText) + '</div>' +
            '</div>' +
          '</div>';
        }

        else if (type === 'progress') {
          html += '<div style="padding:8px 0">' +
            '<div class="bp-text-label" style="margin-bottom:6px">' + format(b.label) + '</div>' +
            '<div class="bp-progress-bar">' +
              '<div class="bp-progress-fill" style="width:' + (b.percentage || 75) + '%; background:' + (b.color || ic) + '">&nbsp;</div>' +
            '</div>' +
          '</div>';
        }

        else if (type === 'trust_badges') {
          html += '<div class="bp-trust-row">';
          (b.badges || ['check_badge', 'shield']).forEach(function(icon) {
            html += '<div title="' + icon + '">' + getIcon(icon, ic, 24) + '</div>';
          });
          html += '</div>';
        }

        else if (type === 'divider') html += '<div style="height:' + (b.height || 1) + 'px; background:' + (b.color || bc) + '; margin:8px 0"></div>';
        else if (type === 'spacer') html += '<div style="height:' + (b.height || 16) + 'px"></div>';
      });

      html += '</div></div>';
      container.innerHTML = html;
    };

    fetch('/apps/bp-delivery?shop='+encodeURIComponent(SHOP)+'&product_id='+PRODUCT_ID+'&tags='+encodeURIComponent(PRODUCT_TAGS))
      .then(function(r) { return r.json(); }).then(function(data) {
        if (!data.enabled) { skeleton.style.display='none'; return; }
        skeleton.style.display = 'none'; content.style.display = 'block';
        renderWidget(data, content);
        startTimer(8100);
        console.log("[BP-Delivery] Render Complete for: " + content.id);
      }).catch(function() { skeleton.style.display='none'; });
  }

  function init() {
    var containers = document.querySelectorAll('#bp-delivery-embed-content, #bp-delivery-block-content');
    containers.forEach(function(container) {
      if (container.getAttribute('data-bp-init')) return;
      container.setAttribute('data-bp-init', 'true');

      var SHOP = container.getAttribute('data-shop');
      var PRODUCT_ID = container.getAttribute('data-product-id');
      var PRODUCT_TAGS = (container.getAttribute('data-product-tags') || '').toLowerCase();
      var skeleton = container.querySelector('.bp-skeleton') || document.getElementById(container.id + '-skeleton');
      
      runWidgetFlow(SHOP, PRODUCT_ID, PRODUCT_TAGS, container, skeleton);
    });
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Custom event for dynamic themes
  document.addEventListener('bp:delivery:refresh', init);
})();
