/**
 * BP: Estimated Delivery & Geo - storefront rendering engine.
 * Merchant-controlled content is rendered with DOM APIs so text never becomes
 * executable HTML.
 */
(function () {
  "use strict";

  if (window.__bpDeliveryLoaded) return;
  window.__bpDeliveryLoaded = true;

  function phosphorIcon(s, body) {
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  var ICON_PATHS =   {
      "bag": "<path d=\"M224,56V200a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8H216A8,8,0,0,1,224,56Z\" opacity=\"0.2\"/><path d=\"M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z\"/>",
      "cart": "<path d=\"M224,64l-12.16,66.86A16,16,0,0,1,196.1,144H70.55L56,64Z\" opacity=\"0.2\"/><path d=\"M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z\"/>",
      "package": "<path d=\"M128,129.09V232a8,8,0,0,1-3.84-1l-88-48.18a8,8,0,0,1-4.16-7V80.18a8,8,0,0,1,.7-3.25Z\" opacity=\"0.2\"/><path d=\"M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z\"/>",
      "box": "<path d=\"M128,129.09V232a8,8,0,0,1-3.84-1l-88-48.16a8,8,0,0,1-4.16-7V80.2a8,8,0,0,1,.7-3.27Z\" opacity=\"0.2\"/><path d=\"M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32h0l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z\"/>",
      "truck": "<path d=\"M248,120v64a8,8,0,0,1-8,8H216a24,24,0,0,0-48,0H104a24,24,0,0,0-48,0H32a8,8,0,0,1-8-8V144H184V120Z\" opacity=\"0.2\"/><path d=\"M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z\"/>",
      "truck_mini": "<path d=\"M248,120v64a8,8,0,0,1-8,8H216a24,24,0,0,0-48,0H104a24,24,0,0,0-48,0H32a8,8,0,0,1-8-8V144H184V120Z\" opacity=\"0.2\"/><path d=\"M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z\"/>",
      "scooter": "<path d=\"M131,168H8a48,48,0,0,1,32-45.27V96h64Z\" opacity=\"0.2\"/><path d=\"M216,128a39.3,39.3,0,0,0-6.27.5L175.49,37.19A8,8,0,0,0,168,32H136a8,8,0,0,0,0,16h26.46l32.3,86.13a40.13,40.13,0,0,0-18,25.87H136.54l-25-66.81A8,8,0,0,0,104,88H24a8,8,0,0,0,0,16h8v13.39A56.12,56.12,0,0,0,0,168a8,8,0,0,0,8,8h8.8a40,40,0,0,0,78.4,0h81.6A40,40,0,1,0,216,128ZM56,192a24,24,0,0,1-22.62-16H78.62A24,24,0,0,1,56,192ZM16.81,160a40.07,40.07,0,0,1,25.86-29.73A8,8,0,0,0,48,122.73V104H98.46l21,56ZM216,192a24,24,0,0,1-15.43-42.36l7.94,21.17a8,8,0,0,0,15-5.62L215.55,144H216a24,24,0,0,1,0,48Z\"/>",
      "plane": "<path d=\"M209,81l-33,31,32,88-24,24-48-72-24,24v24L88,224,72,184,32,168l24-24H80l24-24L32,72,56,48l88,32,31-33A24,24,0,0,1,209,81Z\" opacity=\"0.2\"/><path d=\"M185.33,114.21l29.14-27.43.17-.16a32,32,0,0,0-45.26-45.26l-.16.17L141.79,70.67l-83-30.2a8,8,0,0,0-8.39,1.86l-24,24a8,8,0,0,0,1.22,12.31l63.89,42.59L76.69,136H56a8,8,0,0,0-5.65,2.34l-24,24A8,8,0,0,0,29,175.42l36.82,14.73,14.7,36.75.06.16a8,8,0,0,0,13.18,2.47l23.87-23.88A8,8,0,0,0,120,200V179.31l14.76-14.76,42.59,63.89a8,8,0,0,0,12.31,1.22l24-24a8,8,0,0,0,1.86-8.39Zm-.07,97.23-42.59-63.89A8,8,0,0,0,136.8,144a7.09,7.09,0,0,0-.79,0,8,8,0,0,0-5.66,2.34l-24,24A8,8,0,0,0,104,176v20.69L90.93,209.76,79.43,181A8,8,0,0,0,75,176.57l-28.74-11.5L59.32,152H80a8,8,0,0,0,5.66-2.34l24-24a8,8,0,0,0-1.22-12.32L44.56,70.74l13.5-13.49,83.22,30.26a8,8,0,0,0,8.56-2l30.94-32.88A16,16,0,0,1,203.4,75.22l-32.87,30.94a8,8,0,0,0-2,8.56l30.26,83.22Z\"/>",
      "warehouse": "<path d=\"M184,128v64H72V128Z\" opacity=\"0.2\"/><path d=\"M240,184h-8V57.9l9.67-2.08a8,8,0,1,0-3.35-15.64l-224,48A8,8,0,0,0,16,104a8.16,8.16,0,0,0,1.69-.18L24,102.47V184H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,99,216,61.33V184H192V128a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v56H40Zm136,53H80V136h96ZM80,168h96v16H80Z\"/>",
      "map_pin": "<path d=\"M128,24a80,80,0,0,0-80,80c0,72,80,128,80,128s80-56,80-128A80,80,0,0,0,128,24Zm0,112a32,32,0,1,1,32-32A32,32,0,0,1,128,136Z\" opacity=\"0.2\"/><path d=\"M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z\"/>",
      "route": "<path d=\"M160,72V216L96,184V40Z\" opacity=\"0.2\"/><path d=\"M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z\"/>",
      "home": "<path d=\"M216,116.69V216H152V152H104v64H40V116.69l82.34-82.35a8,8,0,0,1,11.32,0Z\" opacity=\"0.2\"/><path d=\"M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z\"/>",
      "shield": "<path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" opacity=\"0.2\"/><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/>",
      "check_badge": "<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" opacity=\"0.2\"/><path d=\"M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z\"/>",
      "clock": "<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" opacity=\"0.2\"/><path d=\"M232,136.66A104.12,104.12,0,1,1,119.34,24,8,8,0,0,1,120.66,40,88.12,88.12,0,1,0,216,135.34,8,8,0,0,1,232,136.66ZM120,72v56a8,8,0,0,0,8,8h56a8,8,0,0,0,0-16H136V72a8,8,0,0,0-16,0Zm40-24a12,12,0,1,0-12-12A12,12,0,0,0,160,48Zm36,24a12,12,0,1,0-12-12A12,12,0,0,0,196,72Zm24,36a12,12,0,1,0-12-12A12,12,0,0,0,220,108Z\"/>",
      "calendar": "<path d=\"M216,48V88H40V48a8,8,0,0,1,8-8H208A8,8,0,0,1,216,48Z\" opacity=\"0.2\"/><path d=\"M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z\"/>",
      "rocket": "<path d=\"M184,120v61.65a8,8,0,0,1-2.34,5.65l-34.35,34.35a8,8,0,0,1-13.57-4.53L128,176ZM136,72H74.35a8,8,0,0,0-5.65,2.34L34.35,108.69a8,8,0,0,0,4.53,13.57L80,128ZM40,216c37.65,0,50.69-19.69,54.56-28.18L68.18,161.44C59.69,165.31,40,178.35,40,216Z\" opacity=\"0.2\"/><path d=\"M223.85,47.12a16,16,0,0,0-15-15c-12.58-.75-44.73.4-71.41,27.07L132.69,64H74.36A15.91,15.91,0,0,0,63,68.68L28.7,103a16,16,0,0,0,9.07,27.16l38.47,5.37,44.21,44.21,5.37,38.49a15.94,15.94,0,0,0,10.78,12.92,16.11,16.11,0,0,0,5.1.83A15.91,15.91,0,0,0,153,227.3L187.32,193A15.91,15.91,0,0,0,192,181.64V123.31l4.77-4.77C223.45,91.86,224.6,59.71,223.85,47.12ZM74.36,80h42.33L77.16,119.52,40,114.34Zm74.41-9.45a76.65,76.65,0,0,1,59.11-22.47,76.46,76.46,0,0,1-22.42,59.16L128,164.68,91.32,128ZM176,181.64,141.67,216l-5.19-37.17L176,139.31Zm-74.16,9.5C97.34,201,82.29,224,40,224a8,8,0,0,1-8-8c0-42.29,23-57.34,32.86-61.85a8,8,0,0,1,6.64,14.56c-6.43,2.93-20.62,12.36-23.12,38.91,26.55-2.5,36-16.69,38.91-23.12a8,8,0,1,1,14.56,6.64Z\"/>",
      "heart": "<path d=\"M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z\" opacity=\"0.2\"/><path d=\"M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z\"/>",
      "store": "<path d=\"M224,96v16a32,32,0,0,1-64,0V96H96v16a32,32,0,0,1-64,0V96L46.34,45.8A8,8,0,0,1,54,40H202a8,8,0,0,1,7.69,5.8Z\" opacity=\"0.2\"/><path d=\"M231.69,93.81,217.35,43.6A16.07,16.07,0,0,0,202,32H54A16.07,16.07,0,0,0,38.65,43.6L24.31,93.81A7.94,7.94,0,0,0,24,96v16a40,40,0,0,0,16,32v72a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V144a40,40,0,0,0,16-32V96A7.94,7.94,0,0,0,231.69,93.81ZM54,48H202l11.42,40H42.61Zm98,56v8a24,24,0,0,1-48,0v-8ZM51.06,132.2A24,24,0,0,1,40,112v-8H88v8a24,24,0,0,1-35.12,21.26A7.88,7.88,0,0,0,51.06,132.2ZM200,208H56V151.2a40.57,40.57,0,0,0,8,.8,40,40,0,0,0,32-16,40,40,0,0,0,64,0,40,40,0,0,0,32,16,40.57,40.57,0,0,0,8-.8Zm16-96a24,24,0,0,1-11.07,20.2,8.08,8.08,0,0,0-1.8,1.05A24,24,0,0,1,168,112v-8h48Z\"/>",
      "monitor": "<path d=\"M224,64V176a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V64A16,16,0,0,1,48,48H208A16,16,0,0,1,224,64Z\" opacity=\"0.2\"/><path d=\"M208,40H48A24,24,0,0,0,24,64V176a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Zm-48,48a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,224Z\"/>",
      "tag": "<path d=\"M237.66,153,153,237.66a8,8,0,0,1-11.31,0L42.34,138.34A8,8,0,0,1,40,132.69V40h92.69a8,8,0,0,1,5.65,2.34l99.32,99.32A8,8,0,0,1,237.66,153Z\" opacity=\"0.2\"/><path d=\"M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z\"/>",
      "sparkles": "<path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" opacity=\"0.2\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/>"
  };
  var IconList = {};
  Object.keys(ICON_PATHS).forEach(function (key) {
    IconList[key] = function (_color, size) { return phosphorIcon(size, ICON_PATHS[key]); };
  });
  var LORDICON_SCRIPT_ID = "bp-lordicon-player";
  var LORDICON_SCRIPT_SRC = "https://cdn.lordicon.com/lordicon.js";
  var LORDICON_PRESETS = {
    cart: "cart",
    bag: "shopping-bag",
    package: "package-box",
    box: "package-box",
    truck: "delivery-truck",
    truck_mini: "delivery-truck",
    scooter: "delivery-truck",
    plane: "express-dispatch",
    warehouse: "store-pickup",
    map_pin: "location-pin",
    route: "location-pin",
    home: "home-delivery",
    shield: "protected",
    check_badge: "protected",
    clock: "cutoff-timer",
    calendar: "cutoff-timer",
    rocket: "express-dispatch",
    heart: "care-promise",
    store: "store-pickup",
    monitor: "online-order",
    tag: "promo-tag",
    sparkles: "express-dispatch"
  };
  var LORDICON_HOVER_STATES = {
    cart: "hover-jump",
    bag: "hover-pinch",
    package: "hover-squeeze",
    box: "hover-squeeze",
    truck: "hover-pinch",
    truck_mini: "hover-pinch",
    scooter: "hover-pinch",
    plane: "hover-flying",
    warehouse: "hover-pinch",
    map_pin: "hover-jump",
    route: "hover-jump",
    home: "hover-3d-roll",
    shield: "hover-click",
    check_badge: "hover-click",
    clock: "hover-pinch",
    calendar: "hover-pinch",
    rocket: "hover-flying",
    heart: "hover-pinch",
    store: "hover-pinch",
    monitor: "hover-popup",
    tag: "hover-pinch",
    sparkles: "hover-flying"
  };
  var LORDICON_INTRO_STATES = {
    cart: "in-reveal",
    bag: "in-reveal",
    package: "in-reveal",
    box: "in-reveal",
    truck: "in-reveal",
    truck_mini: "in-reveal",
    scooter: "in-reveal",
    plane: "in-flying",
    warehouse: "in-reveal",
    map_pin: "in-jump",
    route: "in-jump",
    home: "in-reveal",
    shield: "in-reveal",
    check_badge: "in-reveal",
    clock: "in-reveal",
    calendar: "in-reveal",
    rocket: "in-flying",
    heart: "in-reveal",
    store: "in-reveal",
    monitor: "in-reveal",
    tag: "in-reveal",
    sparkles: "in-flying"
  };
  var LORDICON_LOOP_STATES = {
    bag: "loop-cycle",
    truck: "loop-cycle",
    truck_mini: "loop-cycle",
    scooter: "loop-cycle",
    plane: "loop-flying",
    map_pin: "loop-roll",
    route: "loop-roll",
    home: "loop-3d-roll",
    clock: "loop-cycle",
    calendar: "loop-cycle",
    rocket: "loop-flying",
    heart: "loop-cycle",
    sparkles: "loop-flying"
  };
  var LORDICON_STATES_BY_FILE = {
    "cart": { hover: "hover-jump", intro: "in-reveal" },
    "shopping-bag": { hover: "hover-pinch", intro: "in-reveal", loop: "loop-cycle" },
    "package-box": { hover: "hover-squeeze", intro: "in-reveal" },
    "delivery-truck": { hover: "hover-pinch", intro: "in-reveal", loop: "loop-cycle" },
    "location-pin": { hover: "hover-jump", intro: "in-jump", loop: "loop-roll" },
    "home-delivery": { hover: "hover-3d-roll", intro: "in-reveal", loop: "loop-3d-roll" },
    "cutoff-timer": { hover: "hover-pinch", intro: "in-reveal", loop: "loop-cycle" },
    "express-dispatch": { hover: "hover-flying", intro: "in-flying", loop: "loop-flying" },
    "protected": { hover: "hover-click", intro: "in-reveal" },
    "care-promise": { hover: "hover-pinch", intro: "in-reveal", loop: "loop-cycle" },
    "store-pickup": { hover: "hover-pinch", intro: "in-reveal" },
    "online-order": { hover: "hover-popup", intro: "in-reveal" },
    "promo-tag": { hover: "hover-pinch", intro: "in-reveal" }
  };
  var LORDICON_TRIGGERS = { in: true, click: true, hover: true, loop: true, "loop-on-hover": true, boomerang: true, morph: true, sequence: true };
  var LORDICON_STROKES = { light: true, regular: true, bold: true };
  var LORDICON_CDN_URL = /^https:\/\/cdn\.lordicon\.com\/[a-z0-9-]+\.json$/i;
  var LORDICON_LOCAL_PATH = /^\/icons\/animated\/([a-z0-9-]+)\.json$/i;

  var BLOCK_TYPES = {
    header: true,
    steps: true,
    promise_card: true,
    timer: true,
    banner: true,
    policy_accordion: true,
    dual_info: true,
    progress: true,
    trust_badges: true,
    divider: true,
    spacer: true,
    image: true
  };
  var STEP_PRESETS = {
    horizontal: true,
    timeline_dots: true,
    thick: true,
    chevron: true,
    vertical: true,
    boxed_cards: true,
    boxed_steps: true,
    split_segments: true
  };
  function hasTimelineConnector(preset) {
    return preset === "timeline_dots";
  }
  function hasVerticalConnector(preset) {
    return preset === "vertical";
  }
  var ALIGNMENTS = { left: true, center: true, right: true };
  var SHADOWS = { none: true, sm: true, md: true, lg: true, xl: true, premium: true };
  var ICON_PATH = /^\/icons\/(?:delivery|ordered|shipped)\/[a-z0-9-]+\.png$/i;
  var COUNTRY_STORAGE_KEY = "bpDeliveryCountry";
  var currentCountdown = "00:00:00";
  var countdownTimerId = null;
  var addToCartTrackingAttached = false;
  var lastTrackingContext = null;

  function text(value, fallback) {
    if (value === undefined || value === null) return fallback || "";
    return String(value);
  }

  function number(value, fallback, min, max) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function option(value, allowed, fallback) {
    var key = text(value);
    return allowed[key] ? key : fallback;
  }

  function color(value, fallback) {
    var raw = text(value).trim();
    if (/^#[0-9a-f]{3,8}$/i.test(raw)) return raw;
    if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(raw)) return raw;
    if (raw === "transparent" || raw === "inherit" || raw === "currentColor") return raw;
    return fallback;
  }

  function background(value, fallback) {
    var raw = text(value).trim();
    if (!raw) return fallback;
    if (color(raw, "") === raw) return raw;
    if (/^(?:linear|radial)-gradient\(/i.test(raw) && !/[;<>]/.test(raw) && !/url\s*\(/i.test(raw)) {
      return raw.slice(0, 300);
    }
    return fallback;
  }

  function safeUrl(value) {
    var raw = text(value).trim();
    if (!raw) return "";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    try {
      var parsed = new URL(raw);
      return parsed.protocol === "https:" ? parsed.href : "";
    } catch (_error) {
      return "";
    }
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function isRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeCountry(value) {
    var country = text(value).trim().toUpperCase();
    if (country === "OTHER" || /^[A-Z]{2}$/.test(country)) return country;
    return "";
  }

  function savedCountry() {
    try {
      return normalizeCountry(window.localStorage.getItem(COUNTRY_STORAGE_KEY));
    } catch (_error) {
      return "";
    }
  }

  function storeCountry(country) {
    var normalized = normalizeCountry(country);
    if (!normalized) return "";
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, normalized);
    } catch (_error) {
      return normalized;
    }
    return normalized;
  }

  function countryModal() {
    return document.getElementById("bp-delivery-embed-modal");
  }

  function ensureCountryModal() {
    var existing = countryModal();
    if (existing) return existing;

    var overlay = el("div", "bp-modal-overlay");
    overlay.id = "bp-delivery-embed-modal";
    var modal = el("div", "bp-modal");
    var header = el("div", "bp-modal-header");
    var title = el("span", "bp-modal-title");
    title.textContent = "Shipping Location";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "bp-modal-close";
    close.id = "bp-delivery-embed-modal-close";
    close.setAttribute("aria-label", "Close shipping location selector");
    close.textContent = "x";
    header.appendChild(title);
    header.appendChild(close);

    var label = document.createElement("label");
    label.className = "bp-modal-label";
    label.htmlFor = "bp-delivery-embed-country-select";
    label.textContent = "Select your shipping country";

    var select = document.createElement("select");
    select.id = "bp-delivery-embed-country-select";
    [
      ["AU", "Australia (AUD)"],
      ["US", "United States (USD)"],
      ["GB", "United Kingdom (GBP)"],
      ["CA", "Canada (CAD)"],
      ["FR", "France (EUR)"],
      ["DE", "Germany (EUR)"],
      ["SG", "Singapore (SGD)"],
      ["OTHER", "Other Location"]
    ].forEach(function (item) {
      var optionNode = document.createElement("option");
      optionNode.value = item[0];
      optionNode.textContent = item[1];
      select.appendChild(optionNode);
    });

    var save = document.createElement("button");
    save.type = "button";
    save.className = "bp-modal-btn";
    save.id = "bp-delivery-embed-modal-save";
    save.textContent = "Save & Continue";

    modal.appendChild(header);
    modal.appendChild(label);
    modal.appendChild(select);
    modal.appendChild(save);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    return overlay;
  }

  function openCountryModal() {
    var modal = ensureCountryModal();
    var select = document.getElementById("bp-delivery-embed-country-select");
    var selected = savedCountry();
    if (select && selected) select.value = selected;
    modal.classList.add("open");
  }

  function closeCountryModal() {
    var modal = countryModal();
    if (modal) modal.classList.remove("open");
  }

  function refreshWidgets() {
    init(true);
  }

  function attachCountryModalControls() {
    var modal = ensureCountryModal();
    if (modal.getAttribute("data-bp-controls") === "true") return;
    modal.setAttribute("data-bp-controls", "true");

    var close = document.getElementById("bp-delivery-embed-modal-close");
    var save = document.getElementById("bp-delivery-embed-modal-save");
    var select = document.getElementById("bp-delivery-embed-country-select");

    if (close) close.addEventListener("click", closeCountryModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeCountryModal();
    });
    if (save) {
      save.addEventListener("click", function () {
        var selectedCountry = storeCountry(select && select.value);
        if (lastTrackingContext && selectedCountry) lastTrackingContext.countryCode = selectedCountry;
        trackEvent("country_change", lastTrackingContext);
        closeCountryModal();
        refreshWidgets();
      });
    }
  }

  function tagsArray(value) {
    return text(value)
      .split(",")
      .map(function (tag) { return tag.trim().toLowerCase(); })
      .filter(Boolean);
  }

  function createTrackingContext(config, container) {
    return {
      shop: container.getAttribute("data-shop"),
      productId: container.getAttribute("data-product-id"),
      productTags: container.getAttribute("data-product-tags") || "",
      widgetId: config.widgetId || "",
      countryCode: normalizeCountry(config.countryCode) || savedCountry() || "OTHER"
    };
  }

  function trackEvent(eventType, context) {
    if (!context || !context.shop) return;

    var params = new URLSearchParams({
      shop: text(context.shop),
      product_id: text(context.productId),
      tags: text(context.productTags)
    });
    if (context.countryCode) params.set("country", context.countryCode);

    var body = JSON.stringify({
      eventType: eventType,
      productId: text(context.productId),
      productTags: tagsArray(context.productTags),
      widgetId: text(context.widgetId),
      countryCode: context.countryCode || "OTHER"
    });

    fetch("/apps/bp-delivery/track?" + params.toString(), {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: body
    }).catch(function () {});
  }

  function attachWidgetTracking(widget, context) {
    var hovered = false;
    var clicked = false;
    widget.addEventListener("mouseenter", function () {
      if (hovered) return;
      hovered = true;
      trackEvent("hover", context);
    });
    widget.addEventListener("click", function () {
      if (clicked) return;
      clicked = true;
      trackEvent("click", context);
    });
  }

  function isAddToCartTarget(target) {
    if (!target || !target.closest) return false;
    var control = target.closest("button, input[type='submit'], input[type='button'], a");
    if (!control) return false;
    var label = (
      control.getAttribute("name") + " " +
      control.getAttribute("aria-label") + " " +
      control.getAttribute("value") + " " +
      control.textContent
    ).toLowerCase();
    var form = control.closest("form");
    var action = form ? String(form.getAttribute("action") || "").toLowerCase() : "";
    return action.indexOf("/cart/add") !== -1 || (label.indexOf("add") !== -1 && label.indexOf("cart") !== -1);
  }

  function attachAddToCartTracking() {
    if (addToCartTrackingAttached) return;
    addToCartTrackingAttached = true;
    document.addEventListener("click", function (event) {
      if (isAddToCartTarget(event.target)) {
        trackEvent("add_to_cart", lastTrackingContext);
      }
    }, true);
  }

  function appendFormatted(parent, value, config) {
    var source = text(value);
    var replacements = {
      "{order_date}": text(config.orderDate),
      "{ship_date}": text(config.shipDate),
      "{min_date}": text(config.minDate),
      "{max_date}": text(config.maxDate),
      "{COUNTRY_NAME}": text(config.countryName, "your country"),
      "{COUNTRY_FLAG}": text(config.countryFlag, "")
    };
    var cursor = 0;
    var pattern = /\{order_date\}|\{ship_date\}|\{min_date\}|\{max_date\}|\{countdown\}|\{COUNTRY_NAME\}|\{COUNTRY_FLAG\}/g;
    var match;

    while ((match = pattern.exec(source)) !== null) {
      if (match.index > cursor) {
        parent.appendChild(document.createTextNode(source.slice(cursor, match.index)));
      }
      if (match[0] === "{countdown}") {
        var span = el("span", "bp-timer-val");
        span.textContent = currentCountdown;
        parent.appendChild(span);
      } else {
        parent.appendChild(document.createTextNode(replacements[match[0]] || ""));
      }
      cursor = match.index + match[0].length;
    }

    if (cursor < source.length) {
      parent.appendChild(document.createTextNode(source.slice(cursor)));
    }
  }

  function iconName(id) {
    var raw = text(id);
    if (ICON_PATH.test(raw)) return raw;
    var normalized = raw.startsWith("lucide:") ? raw.replace("lucide:", "").replace(/-/g, "_") : raw;
    return IconList[normalized] ? normalized : "package";
  }

  function ensureLordiconScript() {
    if (document.getElementById(LORDICON_SCRIPT_ID)) return;
    var script = document.createElement("script");
    script.id = LORDICON_SCRIPT_ID;
    script.src = LORDICON_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  function lordiconState(value) {
    var state = text(value, "").trim();
    return /^[a-z0-9_-]{1,48}$/i.test(state) ? state : "";
  }

  function defaultLordiconState(settings, icon, trigger) {
    var explicitState = lordiconState(settings && settings.lordiconState);
    if (explicitState) return explicitState;

    var stateType = trigger === "in" ? "intro" : trigger === "loop" ? "loop" : "hover";
    var preset = text(settings && settings.lordiconPreset, "auto");
    if (preset === "custom") {
      var customUrl = text(settings && settings.lordiconUrl, "").trim();
      var localMatch = LORDICON_LOCAL_PATH.exec(customUrl);
      var states = localMatch ? LORDICON_STATES_BY_FILE[localMatch[1]] : null;
      return states ? states[stateType] || states.hover || "" : "";
    }

    var normalized = preset !== "auto" ? preset : iconName(icon);
    if (stateType === "intro") return LORDICON_INTRO_STATES[normalized] || "";
    if (stateType === "loop") return LORDICON_LOOP_STATES[normalized] || LORDICON_HOVER_STATES[normalized] || "";
    return LORDICON_HOVER_STATES[normalized] || "";
  }

  function lordiconAsset(fileKey) {
    var assets = window.__bpDeliveryLordiconAssets || {};
    return assets[fileKey] || "";
  }

  function lordiconPresetSource(preset) {
    var fileKey = LORDICON_PRESETS[preset];
    return fileKey ? lordiconAsset(fileKey) : "";
  }

  function lordiconSource(settings, icon) {
    settings = settings || {};
    if (settings.iconAnimation !== "lordicon") return "";
    var preset = text(settings.lordiconPreset, "auto");
    if (preset === "custom") {
      var customUrl = text(settings.lordiconUrl, "").trim();
      if (LORDICON_CDN_URL.test(customUrl)) return customUrl;
      var localMatch = LORDICON_LOCAL_PATH.exec(customUrl);
      if (localMatch) {
        var customAsset = lordiconAsset(localMatch[1]);
        if (customAsset) return customAsset;
      }
      return "";
    }
    if (preset !== "auto") {
      var presetSource = lordiconPresetSource(preset);
      if (presetSource) return presetSource;
    }
    var normalized = iconName(icon);
    return lordiconPresetSource(normalized);
  }

  function appendLordicon(wrapper, settings, icon, iconColor, size) {
    var src = lordiconSource(settings, icon);
    if (!src) return false;
    ensureLordiconScript();
    settings = settings || {};
    var displaySize = number(settings.lordiconSize, size, 8, 128);
    wrapper.className += " bp-icon-stack";
    wrapper.style.width = displaySize + "px";
    wrapper.style.height = displaySize + "px";

    var lordIcon = document.createElement("lord-icon");
    lordIcon.className = "bp-lordicon";
    lordIcon.setAttribute("src", src);
    var trigger = option(settings.lordiconTrigger, LORDICON_TRIGGERS, "loop");
    if (trigger === "loop-on-hover") trigger = "loop";
    lordIcon.setAttribute("trigger", trigger);
    lordIcon.setAttribute("stroke", option(settings.lordiconStroke, LORDICON_STROKES, "regular"));
    lordIcon.setAttribute("loading", "lazy");
    lordIcon.setAttribute("speed", String(number(settings.lordiconSpeed, 1, 0.25, 3)));
    lordIcon.setAttribute("colors", "primary:" + color(settings.lordiconPrimaryColor, iconColor) + ",secondary:" + color(settings.lordiconSecondaryColor, iconColor));
    lordIcon.style.width = displaySize + "px";
    lordIcon.style.height = displaySize + "px";
    var state = defaultLordiconState(settings, icon, trigger);
    if (state) lordIcon.setAttribute("state", state);
    wrapper.appendChild(lordIcon);
    return true;
  }

  function createIcon(id, iconColor, size, animationSettings) {
    var safeName = iconName(id);
    var safeSize = number(size, 24, 8, 96);
    var wrapper = el("span", "bp-icon");
    wrapper.style.display = "inline-flex";
    wrapper.style.color = color(iconColor, "#3b82f6");
    var staticWrap = el("span", "bp-icon-static");

    if (ICON_PATH.test(safeName)) {
      if (appendLordicon(wrapper, animationSettings, id, color(iconColor, "#3b82f6"), safeSize)) return wrapper;
      var img = document.createElement("img");
      img.src = safeName;
      img.alt = "";
      img.width = safeSize;
      img.height = safeSize;
      img.style.width = safeSize + "px";
      img.style.height = safeSize + "px";
      img.style.objectFit = "contain";
      staticWrap.appendChild(img);
      wrapper.appendChild(staticWrap);
      return wrapper;
    }

    if (appendLordicon(wrapper, animationSettings, safeName, color(iconColor, "#3b82f6"), safeSize)) return wrapper;
    staticWrap.innerHTML = IconList[safeName]("currentColor", safeSize);
    wrapper.appendChild(staticWrap);
    return wrapper;
  }

  function iconAccent(settings, theme) {
    settings = settings || {};
    return color(settings.iconColor || settings.blockIconColor, theme.iconColor);
  }

  function applyBlockStyle(node, block, theme) {
    if (!node) return null;
    var b = (block && block.settings) || {};
    var wrapper = el("div", "bp-block");
    var bg = background(b.blockBgColor, "");
    var textColor = color(b.blockTextColor, "");
    var align = option(b.blockAlign, { inherit: true, left: true, center: true, right: true }, "inherit");
    var borderWidth = number(b.blockBorderWidth, 0, 0, 20);
    var borderColor = color(b.blockBorderColor, theme.borderColor);
    var shadow = option(b.blockShadow, { none: true, soft: true, deep: true, glow: true }, "none");

    if (bg) wrapper.style.background = bg;
    if (textColor) wrapper.style.color = textColor;
    if (align !== "inherit") wrapper.style.textAlign = align;
    if (b.blockPadding !== undefined) wrapper.style.padding = number(b.blockPadding, 0, 0, 80) + "px";
    if (b.blockRadius !== undefined) {
      wrapper.style.borderRadius = number(b.blockRadius, 0, 0, 100) + "px";
      wrapper.style.overflow = "hidden";
    }
    if (b.blockMarginTop !== undefined) wrapper.style.marginTop = number(b.blockMarginTop, 0, 0, 120) + "px";
    if (b.blockMarginBottom !== undefined) wrapper.style.marginBottom = number(b.blockMarginBottom, 0, 0, 120) + "px";
    if (b.blockOpacity !== undefined) wrapper.style.opacity = number(b.blockOpacity, 100, 20, 100) / 100;
    if (borderWidth > 0 || b.blockBorderColor) wrapper.style.border = (borderWidth || 1) + "px solid " + borderColor;
    if (shadow === "soft") wrapper.style.boxShadow = "var(--bp-shadow-soft)";
    if (shadow === "deep") wrapper.style.boxShadow = "var(--bp-shadow-deep)";
    if (shadow === "glow") wrapper.style.boxShadow = "var(--bp-shadow-glow)";

    wrapper.appendChild(node);
    return wrapper;
  }

  function stepItems(settings, config) {
    var items = Array.isArray(settings.items)
      ? settings.items.filter(isRecord).slice(0, 6).map(function (item, index) {
          return {
            id: text(item.id, "step-" + (index + 1)),
            label: text(item.label, index === 0 ? "Order" : index === 1 ? "Shipped" : "Delivery"),
            subText: text(item.subText, index === 0 ? config.orderDate : index === 1 ? config.shipDate : config.maxDate),
            icon: text(item.icon, index === 0 ? "bag" : index === 1 ? "truck" : "map_pin"),
            bgColor: text(item.bgColor),
            dotColor: text(item.dotColor),
            iconColor: text(item.iconColor),
            labelColor: text(item.labelColor),
            subTextColor: text(item.subTextColor),
            borderColor: text(item.borderColor)
          };
        }).filter(function (item) { return item.label || item.subText || item.icon; })
      : [];

    if (items.length >= 2) return items;

    return [
      { id: "step-1", label: settings.step1Label || "Order", subText: settings.step1SubText || config.orderDate, icon: settings.step1Icon || "bag", bgColor: settings.step1Bg, dotColor: settings.step1DotColor, iconColor: settings.step1IconColor, labelColor: settings.step1LabelColor, subTextColor: settings.step1SubTextColor, borderColor: settings.step1BorderColor },
      { id: "step-2", label: settings.step2Label || "Shipped", subText: settings.step2SubText || config.shipDate, icon: settings.step2Icon || "truck", bgColor: settings.step2Bg, dotColor: settings.step2DotColor, iconColor: settings.step2IconColor, labelColor: settings.step2LabelColor, subTextColor: settings.step2SubTextColor, borderColor: settings.step2BorderColor },
      { id: "step-3", label: settings.step3Label || "Delivery", subText: settings.step3SubText || config.maxDate, icon: settings.step3Icon || "map_pin", bgColor: settings.step3Bg, dotColor: settings.step3DotColor, iconColor: settings.step3IconColor, labelColor: settings.step3LabelColor, subTextColor: settings.step3SubTextColor, borderColor: settings.step3BorderColor }
    ];
  }

  function trustBadgeItems(settings) {
    var badges = Array.isArray(settings.badges) ? settings.badges : ["check_badge", "shield"];
    return badges.slice(0, 8).map(function (badge, index) {
      if (isRecord(badge)) {
        return {
          id: text(badge.id, "trust-" + (index + 1)),
          icon: text(badge.icon, "shield"),
          label: text(badge.label),
          subText: text(badge.subText),
          bgColor: text(badge.bgColor),
          borderColor: text(badge.borderColor),
          iconColor: text(badge.iconColor),
          labelColor: text(badge.labelColor),
          subTextColor: text(badge.subTextColor)
        };
      }
      return {
        id: "trust-" + (index + 1),
        icon: text(badge, "shield"),
        label: "",
        subText: "",
        bgColor: "",
        borderColor: "",
        iconColor: "",
        labelColor: "",
        subTextColor: ""
      };
    });
  }

  function policyItems(settings) {
    var items = Array.isArray(settings.items)
      ? settings.items.filter(isRecord).slice(0, 5).map(function (item, index) {
          return {
            id: text(item.id, "policy-" + (index + 1)),
            title: text(item.title, index === 0 ? "Shipping & delivery" : "Policy"),
            body: text(item.body),
            icon: text(item.icon, index === 0 ? "truck" : "shield"),
            bgColor: text(item.bgColor),
            borderColor: text(item.borderColor),
            iconColor: text(item.iconColor),
            titleColor: text(item.titleColor),
            bodyColor: text(item.bodyColor)
          };
        }).filter(function (item) { return item.title || item.body; })
      : [];

    if (items.length) return items;
    return [
      {
        id: "policy-1",
        title: "Shipping & delivery",
        body: "Orders are prepared quickly and shipped with tracking when available.",
        icon: "truck"
      }
    ];
  }

  function renderHeader(block, config, theme) {
    var b = block.settings || {};
    var container = el("div", "bp-header" + (b.styleType === "title_banner" ? " bp-header-banner" : ""));
    var align = option(b.align, ALIGNMENTS, "center");
    var isBanner = b.styleType === "title_banner";
    var isHorizontal = b.iconPosition === "left" || b.iconPosition === "right";
    var iconPosition = option(b.iconPosition, { top: true, bottom: true, left: true, right: true }, "top");

    container.style.background = isBanner ? background(b.bgColor, "#fde047") : background(b.bgColor, "transparent");
    container.style.color = isBanner ? color(b.textColor, "#000000") : color(b.textColor, "inherit");
    container.style.border = number(b.borderWidth, 0, 0, 10) > 0
      ? number(b.borderWidth, 0, 0, 10) + "px solid " + color(b.borderColor, theme.borderColor)
      : "none";
    container.style.borderRadius = number(b.borderRadius, isBanner ? 8 : 0, 0, 100) + "px";
    container.style.flexDirection = isHorizontal ? "row" : "column";
    container.style.alignItems = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
    container.style.padding = number(b.padding, 0, 0, 80) + "px";
    if (b.gap !== undefined) container.style.gap = number(b.gap, 8, 0, 40) + "px";
    container.style.setProperty("--bp-size", number(b.iconSize, 24, 8, 96) + "px");

    if ((iconPosition === "top" || iconPosition === "left") && b.icon) {
      container.appendChild(createIcon(b.icon, color(b.iconColor || b.blockIconColor, "currentColor"), b.iconSize, b));
    }

    var textWrap = el("div");
    textWrap.style.display = "flex";
    textWrap.style.flexDirection = "column";
    textWrap.style.gap = number(b.textGap, 2, 0, 40) + "px";
    textWrap.style.textAlign = align;

    var label = el("div", "bp-text-label");
    label.style.fontSize = b.titleFontSize !== undefined ? number(b.titleFontSize, 14, 8, 60) + "px" : b.fontSize === "sm" ? "14px" : b.fontSize === "lg" ? "20px" : "inherit";
    label.style.fontWeight = text(b.fontWeight, "");
    label.style.color = color(b.textColor, "");
    appendFormatted(label, b.text || config.shippingMessage || "", config);
    textWrap.appendChild(label);

    if (b.subText) {
      var sub = el("div", "bp-text-sub");
      sub.style.color = color(b.subTextColor, "");
      if (b.subTextFontSize !== undefined) sub.style.fontSize = number(b.subTextFontSize, 12, 8, 40) + "px";
      appendFormatted(sub, b.subText, config);
      textWrap.appendChild(sub);
    }

    container.appendChild(textWrap);

    if ((iconPosition === "bottom" || iconPosition === "right") && b.icon) {
      container.appendChild(createIcon(b.icon, color(b.iconColor || b.blockIconColor, "currentColor"), b.iconSize, b));
    }

    return container;
  }

  function renderSteps(block, config, theme) {
    var b = block.settings || {};
    var preset = option(b.preset, STEP_PRESETS, "horizontal");
    var container = el("div", "bp-steps bp-steps-" + preset.replace("_", "-"));
    var iconSize = number(b.iconSize, preset === "timeline_dots" ? 16 : 22, 8, 96);
    var items = stepItems(b, config);
    var accent = iconAccent(b, theme);

    container.setAttribute("data-count", String(items.length));
    container.style.setProperty("--bp-size", iconSize + "px");
    container.style.setProperty("--bp-gap", number(b.itemGap, 16, 0, 80) + "px");

    items.forEach(function (item, idx) {
      var isFirst = idx === 0;
      var isLast = idx === items.length - 1;
      var itemClass = "bp-timeline-item";
      if (preset === "vertical") itemClass = "bp-vertical-item";
      else if (preset === "boxed_cards" || preset === "boxed_steps") itemClass = "bp-card";
      else if (preset === "split_segments" || preset === "thick" || preset === "chevron") itemClass = "bp-segment";

      var itemNode = el("div", itemClass);
      var usesItemSurface = preset === "boxed_cards" || preset === "boxed_steps" || preset === "split_segments" || preset === "thick" || preset === "chevron";
      var stepBg = usesItemSurface ? background(item.bgColor, "") : "";
      var dotBg = color(item.dotColor, isFirst ? accent : "#ffffff");
      var stepIconColor = color(item.iconColor, isFirst ? "#ffffff" : accent);
      if (stepBg) itemNode.style.background = stepBg;
      if (b.padding !== undefined) itemNode.style.padding = number(b.padding, 16, 0, 80) + "px";
      itemNode.style.borderRadius = number(b.borderRadius, 0, 0, 100) + "px";

      var hasItemBorder = preset === "boxed_cards" || preset === "boxed_steps" || preset === "split_segments";
      if (number(b.borderWidth, 0, 0, 10) > 0 && hasItemBorder) {
        itemNode.style.border = number(b.borderWidth, 0, 0, 10) + "px solid " + color(item.borderColor, isFirst ? accent : "#eeeeee");
      }

      if (!isLast && hasTimelineConnector(preset)) {
        var connector = el("div", "bp-timeline-connector");
        connector.style.borderTopStyle = option(b.connectorStyle, { solid: true, dashed: true, dotted: true }, "dashed");
        connector.style.borderTopColor = accent;
        itemNode.appendChild(connector);
      }
      if (!isLast && hasVerticalConnector(preset)) {
        var verticalConnector = el("div", "bp-vertical-connector");
        verticalConnector.style.borderLeftStyle = option(b.connectorStyle, { solid: true, dashed: true, dotted: true }, "dashed");
        verticalConnector.style.borderLeftColor = accent;
        itemNode.appendChild(verticalConnector);
      }

      var dot = el("div", "bp-timeline-dot");
      dot.style.background = dotBg;
      dot.style.borderColor = usesItemSurface ? color(item.borderColor, dotBg) : dotBg;
      if (b.dotBorderWidth !== undefined) dot.style.borderWidth = number(b.dotBorderWidth, 2, 0, 20) + "px";
      dot.appendChild(createIcon(item.icon, stepIconColor, iconSize, b));
      itemNode.appendChild(dot);

      var textWrap = el("div");
      textWrap.style.display = "flex";
      textWrap.style.flexDirection = "column";
      textWrap.style.gap = "2px";
      textWrap.style.textAlign = preset === "vertical" ? "left" : "center";

      var label = el("div", "bp-text-label");
      label.style.color = color(item.labelColor, "");
      if (b.labelFontSize !== undefined) label.style.fontSize = number(b.labelFontSize, 14, 8, 40) + "px";
      appendFormatted(label, item.label, config);
      textWrap.appendChild(label);

      var sub = el("div", "bp-text-sub");
      sub.style.color = color(item.subTextColor, "");
      if (b.subTextFontSize !== undefined) sub.style.fontSize = number(b.subTextFontSize, 12, 8, 40) + "px";
      appendFormatted(sub, item.subText, config);
      textWrap.appendChild(sub);

      itemNode.appendChild(textWrap);
      container.appendChild(itemNode);
    });

    return container;
  }

  function renderTimer(block, config, theme) {
    var b = block.settings || {};
    var container = el("div", "bp-timer");
    container.style.background = background(b.bgColor, "rgba(0,0,0,0.03)");
    container.style.color = color(b.textColor, "inherit");
    if (number(b.borderWidth, 0, 0, 20) > 0) {
      container.style.border = number(b.borderWidth, 1, 0, 20) + "px solid " + color(b.borderColor, theme.borderColor);
    }
    if (b.borderRadius !== undefined) container.style.borderRadius = number(b.borderRadius, 12, 0, 40) + "px";
    if (b.padding !== undefined) {
      var timerPadding = number(b.padding, 10, 0, 40);
      container.style.padding = timerPadding + "px " + Math.round(timerPadding * 1.2) + "px";
    }
    if (b.fontSize !== undefined) container.style.fontSize = number(b.fontSize, 13, 8, 40) + "px";
    if (b.gap !== undefined) container.style.gap = number(b.gap, 10, 0, 40) + "px";
    container.style.setProperty("--bp-ic", color(b.color || b.blockIconColor, theme.iconColor));
    var dot = el("div", "bp-timer-dot");
    if (b.dotSize !== undefined) {
      var dotSize = number(b.dotSize, 9, 4, 40);
      dot.style.width = dotSize + "px";
      dot.style.height = dotSize + "px";
      dot.style.flexBasis = dotSize + "px";
    }
    container.appendChild(dot);

    var label = el("div", "bp-text-label");
    label.style.fontWeight = text(b.fontWeight, "500");
    appendFormatted(label, b.text !== undefined && b.text !== null ? b.text : (b.timerFormat || "Order in {countdown}"), config);
    container.appendChild(label);
    return container;
  }

  function renderBanner(block, config, theme) {
    var b = block.settings || {};
    var palette = {
      info: ["#e0f2fe", "#7dd3fc"],
      success: ["#dcfce7", "#86efac"],
      warning: ["#fef9c3", "#fde047"],
      error: ["#fee2e2", "#fca5a5"]
    };
    var type = option(b.type, { info: true, success: true, warning: true, error: true }, "info");
    var container = el("div", "bp-banner");
    container.style.background = background(b.bgColor, b.styleType === "outline" ? "transparent" : palette[type][0]);
    container.style.borderColor = color(b.borderColor, palette[type][1]);
    if (b.borderWidth !== undefined) container.style.borderWidth = number(b.borderWidth, 1, 0, 20) + "px";
    if (b.borderRadius !== undefined) container.style.borderRadius = number(b.borderRadius, 12, 0, 40) + "px";
    if (b.padding !== undefined) {
      var bannerPadding = number(b.padding, 12, 0, 40);
      container.style.padding = bannerPadding + "px " + Math.round(bannerPadding * 1.33) + "px";
    }
    container.style.textAlign = option(b.align, ALIGNMENTS, "left");
    container.style.color = color(b.textColor, "inherit");
    if (b.gap !== undefined) container.style.gap = number(b.gap, 12, 0, 40) + "px";
    if (b.fontSize !== undefined) container.style.fontSize = number(b.fontSize, 14, 8, 40) + "px";
    if (b.fontWeight !== undefined) container.style.fontWeight = text(b.fontWeight, "400");

    if (b.icon) container.appendChild(createIcon(b.icon, iconAccent(b, theme), number(b.iconSize, 20, 8, 80), b));

    var body = el("div");
    body.style.flex = "1";
    appendFormatted(body, b.text || "", config);
    container.appendChild(body);
    return container;
  }

  function renderPromiseCard(block, config, theme) {
    var b = block.settings || {};
    var tone = option(b.tone, { success: true, info: true, warning: true, premium: true }, "success");
    var align = option(b.align, ALIGNMENTS, "left");
    var container = el("div", "bp-promise-card bp-promise-" + tone);
    container.style.background = background(b.bgColor, "");
    container.style.borderColor = color(b.borderColor, "");
    container.style.color = color(b.textColor, "inherit");
    container.style.textAlign = align;
    if (b.padding !== undefined) container.style.padding = number(b.padding, 14, 0, 80) + "px";
    if (b.borderRadius !== undefined) container.style.borderRadius = number(b.borderRadius, 14, 0, 80) + "px";
    if (b.borderWidth !== undefined) container.style.borderWidth = number(b.borderWidth, 1, 0, 20) + "px";
    if (b.gap !== undefined) container.style.gap = number(b.gap, 12, 0, 40) + "px";

    var icon = el("div", "bp-promise-icon");
    icon.style.background = background(b.iconBgColor, "");
    if (b.iconBoxSize !== undefined) {
      var iconBoxSize = number(b.iconBoxSize, 42, 16, 120);
      icon.style.width = iconBoxSize + "px";
      icon.style.height = iconBoxSize + "px";
      icon.style.flexBasis = iconBoxSize + "px";
    }
    if (b.iconBoxRadius !== undefined) icon.style.borderRadius = number(b.iconBoxRadius, 999, 0, 999) + "px";
    icon.appendChild(createIcon(b.icon || "truck", iconAccent(b, theme), number(b.iconSize, 24, 8, 80), b));
    container.appendChild(icon);

    var body = el("div", "bp-promise-body");
    var title = el("div", "bp-text-label");
    title.style.color = color(b.titleColor || b.textColor, "");
    if (b.titleFontSize !== undefined) title.style.fontSize = number(b.titleFontSize, 14, 8, 50) + "px";
    appendFormatted(title, b.title || "Get it by {max_date}", config);
    body.appendChild(title);
    if (b.subtitle) {
      var subtitle = el("div", "bp-text-sub");
      subtitle.style.color = color(b.subtitleColor, "");
      if (b.subtitleFontSize !== undefined) subtitle.style.fontSize = number(b.subtitleFontSize, 12, 8, 40) + "px";
      appendFormatted(subtitle, b.subtitle, config);
      body.appendChild(subtitle);
    }
    container.appendChild(body);

    if (b.badgeText) {
      var badge = el("div", "bp-promise-badge");
      badge.style.background = background(b.badgeBgColor, "");
      badge.style.color = color(b.badgeTextColor, "");
      if (b.badgeFontSize !== undefined) badge.style.fontSize = number(b.badgeFontSize, 11, 8, 32) + "px";
      if (b.badgeRadius !== undefined) badge.style.borderRadius = number(b.badgeRadius, 999, 0, 999) + "px";
      appendFormatted(badge, b.badgeText, config);
      container.appendChild(badge);
    }

    return container;
  }

  function renderPolicyAccordion(block, config, theme) {
    var b = block.settings || {};
    var container = el("div", "bp-policy-list");
    if (b.itemGap !== undefined) container.style.gap = number(b.itemGap, 8, 0, 40) + "px";
    policyItems(b).forEach(function (item, index) {
      var details = document.createElement("details");
      details.className = "bp-policy-item";
      var itemBg = background(item.bgColor, "");
      if (itemBg) details.style.background = itemBg;
      if (item.borderColor) details.style.borderColor = color(item.borderColor, theme.borderColor);
      if (b.borderWidth !== undefined) details.style.borderWidth = number(b.borderWidth, 1, 0, 20) + "px";
      if (b.itemRadius !== undefined) details.style.borderRadius = number(b.itemRadius, 12, 0, 40) + "px";
      if (b.openFirst !== false && index === 0) details.open = true;

      var summary = document.createElement("summary");
      summary.className = "bp-policy-summary";
      if (b.itemPadding !== undefined) {
        var itemPadding = number(b.itemPadding, 12, 0, 40);
        summary.style.padding = itemPadding + "px " + (itemPadding + 2) + "px";
      }
      summary.appendChild(createIcon(item.icon, color(item.iconColor, iconAccent(b, theme)), number(b.iconSize, 18, 8, 60), b));
      var summaryText = document.createElement("span");
      summaryText.style.color = color(item.titleColor, "");
      if (b.titleFontSize !== undefined) summaryText.style.fontSize = number(b.titleFontSize, 13, 8, 40) + "px";
      appendFormatted(summaryText, item.title, config);
      summary.appendChild(summaryText);
      details.appendChild(summary);

      var body = el("div", "bp-policy-body");
      body.style.color = color(item.bodyColor, "");
      if (b.bodyFontSize !== undefined) body.style.fontSize = number(b.bodyFontSize, 12, 8, 36) + "px";
      appendFormatted(body, item.body, config);
      details.appendChild(body);
      container.appendChild(details);
    });
    return container;
  }

  function renderDualInfo(block, config, theme) {
    var b = block.settings || {};
    var container = el("div", "bp-dual-info");
    if (b.columnGap !== undefined) container.style.gap = number(b.columnGap, 16, 0, 60) + "px";
    [
      { icon: b.leftIcon || "monitor", title: b.leftTitle || "Online", body: b.leftText, bgColor: b.leftBgColor, borderColor: b.leftBorderColor, iconColor: b.leftIconColor, titleColor: b.leftTitleColor, textColor: b.leftTextColor },
      { icon: b.rightIcon || "store", title: b.rightTitle || "In Store", body: b.rightText, bgColor: b.rightBgColor, borderColor: b.rightBorderColor, iconColor: b.rightIconColor, titleColor: b.rightTitleColor, textColor: b.rightTextColor }
    ].forEach(function (item) {
      var card = el("div", "bp-dual-card");
      var cardBg = background(item.bgColor, "");
      if (cardBg) card.style.background = cardBg;
      if (item.borderColor) card.style.borderColor = color(item.borderColor, theme.borderColor);
      if (b.borderWidth !== undefined) card.style.borderWidth = number(b.borderWidth, 1, 0, 20) + "px";
      if (b.cardRadius !== undefined) card.style.borderRadius = number(b.cardRadius, 16, 0, 40) + "px";
      if (b.cardPadding !== undefined) card.style.padding = number(b.cardPadding, 20, 0, 60) + "px";
      if (b.cardGap !== undefined) card.style.gap = number(b.cardGap, 8, 0, 40) + "px";
      card.appendChild(createIcon(item.icon, color(item.iconColor, iconAccent(b, theme)), number(b.iconSize, 28, 8, 80), b));
      var title = el("div", "bp-text-label");
      title.style.color = color(item.titleColor, "");
      if (b.titleFontSize !== undefined) title.style.fontSize = number(b.titleFontSize, 14, 8, 50) + "px";
      appendFormatted(title, item.title, config);
      card.appendChild(title);
      var body = el("div", "bp-text-sub");
      body.style.color = color(item.textColor, "");
      if (b.textFontSize !== undefined) body.style.fontSize = number(b.textFontSize, 12, 8, 40) + "px";
      appendFormatted(body, item.body || "", config);
      card.appendChild(body);
      container.appendChild(card);
    });
    return container;
  }

  function renderProgress(block, config, theme) {
    var b = block.settings || {};
    var container = el("div");
    container.style.padding = "8px 0";
    var label = el("div", "bp-text-label");
    label.style.marginBottom = "6px";
    label.style.color = color(b.labelColor, "");
    if (b.labelFontSize !== undefined) label.style.fontSize = number(b.labelFontSize, 14, 8, 40) + "px";
    appendFormatted(label, b.label || "", config);
    container.appendChild(label);

    var bar = el("div", "bp-progress-bar");
    var radius = number(b.radius, 20, 0, 40);
    if (b.trackColor) bar.style.background = color(b.trackColor, "#f1f5f9");
    if (b.trackBorderColor || number(b.trackBorderWidth, 0, 0, 20) > 0) {
      bar.style.border = number(b.trackBorderWidth, 1, 0, 20) + "px solid " + color(b.trackBorderColor, theme.borderColor);
    }
    if (b.height !== undefined) bar.style.height = number(b.height, 10, 2, 60) + "px";
    bar.style.borderRadius = radius + "px";
    var fill = el("div", "bp-progress-fill");
    fill.style.width = number(b.percentage, 75, 0, 100) + "%";
    if (b.fillStyle === "gradient") {
      fill.style.background = "linear-gradient(90deg, " + color(b.color || b.blockIconColor, theme.iconColor) + ", " + color(b.gradientEndColor, "#818cf8") + ")";
    } else {
      fill.style.background = color(b.color || b.blockIconColor, theme.iconColor);
    }
    fill.style.borderRadius = radius + "px";
    bar.appendChild(fill);
    container.appendChild(bar);
    return container;
  }

  function renderTrustBadges(block, config, theme) {
    var b = block.settings || {};
    var badges = trustBadgeItems(b);
    var container = el("div", "bp-trust-row");
    if (b.rowGap !== undefined) container.style.gap = number(b.rowGap, 12, 0, 60) + "px";
    badges.forEach(function (badge) {
      var item = el("div", "bp-trust-item");
      item.title = badge.label || iconName(badge.icon);
      var itemBg = background(badge.bgColor, "");
      if (itemBg) item.style.background = itemBg;
      if (badge.borderColor) item.style.border = "1px solid " + color(badge.borderColor, theme.borderColor);
      if (b.itemPadding !== undefined) {
        var badgePadding = number(b.itemPadding, 8, 0, 40);
        item.style.padding = badgePadding + "px " + Math.round(badgePadding * 1.25) + "px";
      }
      if (b.itemRadius !== undefined) item.style.borderRadius = number(b.itemRadius, 999, 0, 999) + "px";
      if (b.itemGap !== undefined) item.style.gap = number(b.itemGap, 8, 0, 40) + "px";
      item.appendChild(createIcon(badge.icon, color(badge.iconColor, iconAccent(b, theme)), number(b.iconSize, 24, 8, 80), b));
      if (badge.label || badge.subText) {
        var copy = el("span", "bp-trust-copy");
        if (badge.label) {
          var label = el("span", "bp-text-label");
          label.style.color = color(badge.labelColor, "");
          if (b.labelFontSize !== undefined) label.style.fontSize = number(b.labelFontSize, 14, 8, 40) + "px";
          appendFormatted(label, badge.label, config);
          copy.appendChild(label);
        }
        if (badge.subText) {
          var sub = el("span", "bp-text-sub");
          sub.style.color = color(badge.subTextColor, "");
          if (b.subTextFontSize !== undefined) sub.style.fontSize = number(b.subTextFontSize, 12, 8, 36) + "px";
          appendFormatted(sub, badge.subText, config);
          copy.appendChild(sub);
        }
        item.appendChild(copy);
      }
      container.appendChild(item);
    });
    return container;
  }

  function renderImage(block) {
    var b = block.settings || {};
    var url = safeUrl(b.url);
    if (!url) return null;
    var wrap = el("div");
    wrap.style.textAlign = option(b.align, ALIGNMENTS, "center");
    var img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.loading = "lazy";
    img.style.maxWidth = "100%";
    img.style.width = text(b.width, "auto");
    img.style.height = text(b.height, "auto");
    img.style.objectFit = option(b.objectFit, { contain: true, cover: true, fill: true }, "contain");
    if (b.borderRadius !== undefined) img.style.borderRadius = number(b.borderRadius, 0, 0, 100) + "px";
    if (number(b.borderWidth, 0, 0, 20) > 0) {
      img.style.border = number(b.borderWidth, 0, 0, 20) + "px solid " + color(b.borderColor, "#e5e7eb");
    }
    if (b.opacity !== undefined) img.style.opacity = number(b.opacity, 100, 20, 100) / 100;
    wrap.appendChild(img);
    return wrap;
  }

  function renderBlock(block, config, theme) {
    if (!block || !BLOCK_TYPES[block.type]) return null;
    var node = null;
    if (block.type === "header") node = renderHeader(block, config, theme);
    else if (block.type === "steps") node = renderSteps(block, config, theme);
    else if (block.type === "promise_card") node = renderPromiseCard(block, config, theme);
    else if (block.type === "timer") node = renderTimer(block, config, theme);
    else if (block.type === "banner") node = renderBanner(block, config, theme);
    else if (block.type === "policy_accordion") node = renderPolicyAccordion(block, config, theme);
    else if (block.type === "dual_info") node = renderDualInfo(block, config, theme);
    else if (block.type === "progress") node = renderProgress(block, config, theme);
    else if (block.type === "trust_badges") node = renderTrustBadges(block, config, theme);
    else if (block.type === "image") node = renderImage(block);
    if (block.type === "divider") {
      var divider = el("div");
      divider.style.height = number(block.settings && block.settings.height, 1, 1, 20) + "px";
      divider.style.background = color(block.settings && block.settings.color, theme.borderColor);
      divider.style.margin = "8px 0";
      node = divider;
    }
    else if (block.type === "spacer") {
      var spacer = el("div");
      spacer.style.height = number(block.settings && block.settings.height, 16, 0, 200) + "px";
      node = spacer;
    }
    return applyBlockStyle(node, block, theme);
  }

  function renderLocationControl(config) {
    var countryCode = normalizeCountry(config.countryCode);
    var row = el("div", "bp-location-row");
    row.style.display = "flex";
    row.style.justifyContent = "flex-end";
    row.style.marginTop = "8px";

    var button = document.createElement("button");
    button.type = "button";
    button.className = "bp-change-link";
    button.textContent = countryCode ? "Ship to " + countryCode + " - Change" : "Change shipping country";
    button.addEventListener("click", openCountryModal);
    row.appendChild(button);
    return row;
  }

  function renderWidget(config, container) {
    var s = config.settings || {};
    var blocks = Array.isArray(s.customBlocks) ? s.customBlocks : [];
    var textColor = color(s.textColor, "#1f2937");
    var iconColor = color(s.iconColor, "#3b82f6");
    var bgColor = color(s.bgColor, "#ffffff");
    var borderColor = color(s.borderColor, "#e5e7eb");
    var shadow = option(s.shadow, SHADOWS, "none");
    var theme = { iconColor: iconColor, borderColor: borderColor };

    var widget = el("div", "bp-widget bp-shadow-" + shadow + (s.glassmorphism ? " bp-glass" : ""));
    widget.style.setProperty("--bp-tc", textColor);
    widget.style.setProperty("--bp-ic", iconColor);
    widget.style.setProperty("--bp-bg", bgColor);
    widget.style.setProperty("--bp-bc", borderColor);
    widget.style.setProperty("--bp-rad", number(s.borderRadius, 12, 0, 100) + "px");
    widget.style.setProperty("--bp-pad", number(s.padding, 16, 0, 100) + "px");
    widget.style.background = background(s.bgGradient, bgColor);

    if (number(s.borderWidth, 0, 0, 10) > 0) {
      widget.style.border = number(s.borderWidth, 0, 0, 10) + "px solid " + borderColor;
    }

    var inner = el("div", "bp-container");
    blocks.forEach(function (block) {
      var node = renderBlock(block, config, theme);
      if (node) inner.appendChild(node);
    });
    widget.appendChild(inner);
    widget.appendChild(renderLocationControl(config));

    container.replaceChildren(widget);

    lastTrackingContext = createTrackingContext(config, container);
    trackEvent("view", lastTrackingContext);
    attachWidgetTracking(widget, lastTrackingContext);
  }

  function startTimer(initialSecs) {
    if (countdownTimerId) {
      window.clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
    var sec = initialSecs || 8100;
    var update = function () {
      if (sec > 0) sec -= 1;
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      currentCountdown =
        (h < 10 ? "0" : "") + h + ":" +
        (m < 10 ? "0" : "") + m + ":" +
        (s < 10 ? "0" : "") + s;
      document.querySelectorAll(".bp-timer-val").forEach(function (node) {
        node.textContent = currentCountdown;
      });
    };
    update();
    countdownTimerId = window.setInterval(update, 1000);
    return countdownTimerId;
  }

  function hideSkeleton(skeleton) {
    if (skeleton) skeleton.style.display = "none";
  }

  function runWidgetFlow(shop, productId, productTags, content, skeleton) {
    var country = savedCountry();
    var params = new URLSearchParams({
      shop: text(shop),
      product_id: text(productId),
      tags: text(productTags)
    });
    if (country) params.set("country", country);

    fetch("/apps/bp-delivery?" + params.toString(), { credentials: "same-origin" })
      .then(function (response) { return response.json(); })
      .then(function (payload) {
        if (!payload.enabled) {
          hideSkeleton(skeleton);
          return;
        }
        hideSkeleton(skeleton);
        content.style.display = "block";
        renderWidget(payload, content);
        startTimer(8100);
      })
      .catch(function () {
        hideSkeleton(skeleton);
      });
  }

  function init() {
    var force = arguments.length > 0 && arguments[0] === true;
    attachCountryModalControls();
    attachAddToCartTracking();

    var embedContainer = document.getElementById("bp-delivery-embed-content");
    var blockContainer = document.getElementById("bp-delivery-block-content");
    var containers = blockContainer
      ? [blockContainer]
      : Array.prototype.slice.call(document.querySelectorAll("#bp-delivery-embed-content, #bp-delivery-block-content"));

    if (blockContainer && embedContainer) {
      var embedSkeleton = embedContainer.querySelector(".bp-skeleton") || document.getElementById(embedContainer.id + "-skeleton");
      hideSkeleton(embedSkeleton);
      embedContainer.style.display = "none";
      embedContainer.setAttribute("data-bp-init", "skipped");
    }

    containers.forEach(function (container) {
      if (!force && container.getAttribute("data-bp-init")) return;
      container.setAttribute("data-bp-init", "true");

      var shop = container.getAttribute("data-shop");
      var productId = container.getAttribute("data-product-id");
      var productTags = (container.getAttribute("data-product-tags") || "").toLowerCase();
      var skeleton = container.querySelector(".bp-skeleton") || document.getElementById(container.id + "-skeleton");

      runWidgetFlow(shop, productId, productTags, container, skeleton);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  document.addEventListener("bp:delivery:refresh", init);
})();
