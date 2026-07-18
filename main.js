(function () {
 const PLUGIN_ID = "com.kaka.responsiveliveserver";
 const DEFAULT_WIDTH = 360;
 const DEFAULT_HEIGHT = 667;
 const MIN_SIZE = 0;
 const MAX_SIZE = 3840;

 class ResponsiveWebView {
  constructor() {
   this.container = null; // <---- Plugin container
   this.width = DEFAULT_WIDTH;
   this.height = DEFAULT_HEIGHT;
   this.zoom = 0;
   this.fitHeight = true;

   // Get and save user Link server
   this.url = sessionStorage.getItem("rwv__url") || "";
  }

  // Initialization of Plugin
  async init() {
   // 1. Creating new <div> for plugin
   this.container = document.createElement("div");
   this.container.id = "rwv-main-container";

   // 2. Add <div> into home page as a overlay
   document.body.appendChild(this.container);

   // 3. Rendering HTML content
   this.render();

   // 4. Adding interaction from user to Plugin
   this.bindEvents();

   // 5. Function of: If the plugin has already store the link from user,
   //    skip the popup of inserting link.
   if (this.url) {
    this.loadUrl();
   } else {
    this.promptUrl();
   }
  }

  render() {
   // ===================================================================================================================== //
   //                                            CSS - Style of the plugin layout
   // ===================================================================================================================== //

   this.container.innerHTML = `
      <style>
          #rwv-page * { box-sizing: border-box; margin: 0; padding: 0; }

          /* ==>> OVERLAY TO ADD TANSPARENT TO EDITOR EFFECT <<=== */
          #rwv-page {
            background: transparent !important;
          }

          #rwv-main-container{
          position: fixed;
          inset: 0;
          overflow: hidden;
          z-index: 99999;
          }
          #rwv-wrap {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background: rgba(0,0,0,.2);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            font-family: 'Fira Code', monospace, sans-serif;
            color: #e0e0e0;
            position: relative;
            overflow: hidden;
          }

          /* TOPBAR <<================================================= */
          #rwv-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 255, 255, 0.25);
            flex-shrink: 0;
          }

          #rwv-topbar .rwv-title {
            font-size: 11px;
            color: cyan;
            letter-spacing: 0.5px;
          }

          #rwv-topbar .rwv-actions {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          #rwv-topbar button {
            background: none;
            border: none;
            color: #ccc;
            font-size: 20px;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            line-height: 1;
          }

          #rwv-topbar button:active { background: rgba(255,255,255,0.1); }

          @keyframes rwv-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          #rwv-reload-btn.spinning {
            display: inline-block;
            animation: rwv-spin 0.6s linear infinite;
          }

          /* VIEWPORT <<================================================== */
          #rwv-viewport-wrap {
            flex: 1;
            overflow: auto;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 10px;
            background: rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
          }

          #rwv-iframe-shell {
            background: #fff;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            border-radius: 4px;
            overflow: hidden;
            flex-shrink: 0;
          }

          #rwv-iframe {
            display: block;
            border: none;
            width: 100%;
            height: 100%;
          }

          #rwv-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            gap: 12px;
            color: cyan;
            font-size: 13px;
            text-align: center;
            padding: 20px;
          }

          #rwv-empty span { font-size: 36px; }

          /* CONTROLS <<================================================== */
          #rwv-controls {
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-top: 1px solid cyan;
            box-shadow: 0 -4px 12px -4px rgba(0,255,255,0.4);
            padding: 12px 16px;
            flex-shrink: 0;
            user-select: none;
            bottom: 0;
          }

          .rwv-slider-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
          }

          .rwv-slider-row:last-child { margin-bottom: 0; }

          .rwv-slider-label {
            font-size: 12px;
            color: cyan;
            width: 115px;
            flex-shrink: 0;
          }

          .rwv-slider-label span {
            color: #b2ffff;
            font-weight: bold;
          }

          .rwv-slider-row input[type='range'] {
            flex: 1;
            height: 4px;
            accent-color: cyan;
            cursor: pointer;
          }

          .rwv-btn-pm {
            background: transparent;
            border: 1px solid cyan;
            color: #fff;
            width: 34px;
            height: 34px;
            border-radius: 6px;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            user-select: none;
            -webkit-user-select: none;
            line-height: 1;
          }

          .rwv-btn-pm:active { background: cyan; color: #000; }

          /* MENU OVERLAY <<================================================== */
          #rwv-menu-overlay {
            display: none;
            position: absolute;
            inset: 0;
            z-index: 50;
          }

          #rwv-menu-overlay.open { display: block; }

          #rwv-menu {
            position: absolute;
            top: 50px;
            right: 12px;
            background: rgba(10, 15, 35, 0.92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(0, 255, 255, 0.2);
            border-radius: 14px;
            color: white;
            min-width: 260px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          }

          .rwv-menu-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: rgba(0,0,0,0.3);
            font-size: 12px;
            color: #888;
            border-bottom: 1px solid rgba(0,255,255,0.15);
          }

          .rwv-menu-header span:last-child {
            color: cyan;
            font-weight: bold;
            font-size: 11px;
          }

          /* SCREEN SIZE TEMPLATE <<================================================== */
          .rwv-preset-list {
            padding: 4px 0;
            border-bottom: 1px solid rgba(0,255,255,0.1);
          }

          .rwv-preset-list details {
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }

          .rwv-preset-list details:last-child { border-bottom: none; }

          .rwv-preset-list summary {
            padding: 10px 16px;
            font-size: 12px;
            color: #bbb;
            cursor: pointer;
            list-style: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .rwv-preset-list summary:active { background: rgba(255,255,255,0.05); }
          .rwv-preset-list summary::after { content: '▼'; font-size: 9px; color: #555; }
          .rwv-preset-list details[open] summary::after { content: '▲'; }

          .rwv-preset-btn {
            display: block;
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            padding: 8px 24px;
            color: #888;
            font-size: 12px;
            cursor: pointer;
          }

          .rwv-preset-btn:active { background: rgba(0,255,255,0.08); color: cyan; }

          /* MENU ITEMS <<================================================== */
          .rwv-menu-section { padding: 6px 0; }

          .rwv-menu-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            cursor: pointer;
            font-size: 13px;
            color: #ccc;
            gap: 8px;
          }

          .rwv-menu-item:active { background: rgba(255,255,255,0.05); }

          .rwv-menu-item .rwv-mi-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .rwv-menu-item .rwv-mi-icon {
            font-size: 15px;
            width: 22px;
            text-align: center;
            flex-shrink: 0;
          }

          .rwv-toggle {
            width: 38px;
            height: 22px;
            background: #333;
            border-radius: 11px;
            position: relative;
            transition: background 0.2s;
            flex-shrink: 0;
          }

          .rwv-toggle.on { background: cyan; }

          .rwv-toggle::after {
            content: '';
            position: absolute;
            width: 18px;
            height: 18px;
            background: #fff;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: left 0.2s;
          }

          .rwv-toggle.on::after { left: 18px; }

          .rwv-menu-divider {
            height: 1px;
            background: rgba(0,255,255,0.15);
            margin: 2px 0;
          }

          /* URL POPUP  <<================================================== */
          #rwv-url-popup {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 100;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }

          #rwv-url-popup.show { display: flex; }

          #rwv-url-box {
            background: rgba(10, 15, 40, 0.96);
            border: 1px solid rgba(0,255,255,0.25);
            border-radius: 14px;
            padding: 24px;
            width: 100%;
            max-width: 340px;
          }

          #rwv-url-box h3 {
            font-size: 15px;
            color: cyan;
            margin-bottom: 8px;
          }

          #rwv-url-box p {
            font-size: 12px;
            color: #666;
            margin-bottom: 16px;
            line-height: 1.5;
          }

          #rwv-url-input {
            width: 100%;
            background: rgba(0,0,0,0.5);
            border: 1px solid rgba(0,255,255,0.3);
            border-radius: 8px;
            padding: 11px 14px;
            color: #e0e0e0;
            font-size: 13px;
            margin-bottom: 16px;
            outline: none;
            display: block;
          }

          #rwv-url-input:focus { border-color: cyan; }

          .rwv-url-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }

          .rwv-url-actions button {
            padding: 9px 20px;
            border-radius: 8px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
          }

          #rwv-url-cancel {
            background: rgba(255,255,255,0.08);
            color: #aaa;
          }

          #rwv-url-confirm {
            background: cyan;
            color: #000;
            font-weight: bold;
          }
          
          /* TOAST <<================================================== */
         #rwv-toast {
            position: fixed;
            top: 24px;
            left: 50%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transform: translateX(-50%) translateY(20px);
            background: rgba(10, 15, 40, 0.96);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(0, 255, 255, 0.25);
            border-radius: 12px;
            color: #e0e0e0;
            font-size: 13px;
            padding: 8px 12px;
            opacity: 0;
            pointer-events: none;
            transition:
              opacity 0.25s ease,
              transform 0.25s ease;
            z-index: 999999;
          }
          
          #toast-icon {
            text-align: center;
            margin-bottom: 5px;
          }
          
          #toast-text {
            font-size: 11px;
            text-align: center;
          }
          
          #rwv-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        </style>
      <div id="rwv-wrap">
        <!-- TOP BAR SECTION -->
         <div id="rwv-topbar">
            <div class="rwv-title" id="rwv-size-label">RESPONSIVE By Bayanaka</div>
            <div class="rwv-actions">
              <button id="rwv-reload-btn" title="Reload">&#x21BB;</button>
              <button id="rwv-menu-btn" title="Options">&#x22EE;</button>
            </div>
          </div>

          <div id="rwv-viewport-wrap">
            <div id="rwv-empty">
              <span>🌐</span>
              <p>No URL set yet.<br>Tap ⋮ → Enter URL to start.</p>
            </div>
            <div id="rwv-iframe-shell" style="display:none;">
              <iframe id="rwv-iframe" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
            </div>
          </div>
          <!-- CONTROL SECTION -->
          <div id="rwv-controls">
            <div class="rwv-slider-row">
              <div class="rwv-slider-label">width: <span id="rwv-w-val">360</span>px</div>
              <button class="rwv-btn-pm" id="rwv-w-minus">−</button>
              <input type="range" id="rwv-w-slider" min="${MIN_SIZE}" max="${MAX_SIZE}" value="${DEFAULT_WIDTH}" step="1">
              <button class="rwv-btn-pm" id="rwv-w-plus">+</button>
            </div>
            <div class="rwv-slider-row" id="rwv-h-row" style="display:none;">
              <div class="rwv-slider-label">height: <span id="rwv-h-val">667</span>px</div>
              <button class="rwv-btn-pm" id="rwv-h-minus">−</button>
              <input type="range" id="rwv-h-slider" min="${MIN_SIZE}" max="${MAX_SIZE}" value="${DEFAULT_HEIGHT}" step="1">
              <button class="rwv-btn-pm" id="rwv-h-plus">+</button>
            </div>
            <div class="rwv-slider-row">
              <div class="rwv-slider-label">zoom: <span id="rwv-z-val">0</span>%</div>
              <button class="rwv-btn-pm" id="rwv-z-minus">−</button>
              <input type="range" id="rwv-z-slider" min="-90" max="200" value="0" step="1">
              <button class="rwv-btn-pm" id="rwv-z-plus">+</button>
            </div>
          </div>
        </div>

        <!-- MENU OVERLAY Absolute to #rwv-page -->
        <div id="rwv-menu-overlay">
          <div id="rwv-menu">
            <div class="rwv-menu-header">
              <span>Screen Sizes</span>
              <span id="rwv-menu-size">360×667</span>
            </div>
            <div class="rwv-preset-list">
              <details>
                <summary>📱 Mobile</summary>
                <button class="rwv-preset-btn" data-w="360" data-h="667">Mobile S — 360×667</button>
                <button class="rwv-preset-btn" data-w="375" data-h="812">Mobile M — 375×812</button>
                <button class="rwv-preset-btn" data-w="414" data-h="896">Mobile L — 414×896</button>
              </details>
              <details>
                <summary>📟 Tablet</summary>
                <button class="rwv-preset-btn" data-w="768" data-h="1024">Tablet — 768×1024</button>
                <button class="rwv-preset-btn" data-w="1024" data-h="768">Tablet L — 1024×768</button>
              </details>
              <details>
                <summary>🖥️ Desktop</summary>
                <button class="rwv-preset-btn" data-w="1280" data-h="800">Laptop — 1280×800</button>
                <button class="rwv-preset-btn" data-w="1920" data-h="1080">Full HD — 1920×1080</button>
              </details>
              <details>
                <summary>⚡ 2K / 4K</summary>
                <button class="rwv-preset-btn" data-w="2560" data-h="1440">2K — 2560×1440</button>
                <button class="rwv-preset-btn" data-w="3840" data-h="2160">4K — 3840×2160</button>
              </details>
            </div>

            <div class="rwv-menu-divider"></div>
            <div class="rwv-menu-section">
              <div class="rwv-menu-item" id="rwv-mi-fitHeight">
                <div class="rwv-mi-left">
                  <span class="rwv-mi-icon">↕️</span>
                  <span>Fit Height</span>
                </div>
                <div class="rwv-toggle on" id="rwv-toggle-fitHeight"></div>
              </div>
              <div class="rwv-menu-item" id="rwv-mi-url">
                <div class="rwv-mi-left">
                  <span class="rwv-mi-icon">🔗</span>
                  <span>Change URL</span>
                </div>
              </div>
              <div class="rwv-menu-item" id="rwv-mi-console">
                <div class="rwv-mi-left">
                  <span class="rwv-mi-icon">⌨️</span>
                  <span>Console (Eruda)</span>
                </div>
              </div>
              <div class="rwv-menu-item" id="rwv-mi-cache">
                <div class="rwv-mi-left">
                  <span class="rwv-mi-icon">🗑️</span>
                  <span>Clear Cache</span>
                </div>
              </div>
              <div class="rwv-menu-item" id="rwv-mi-browser">
                <div class="rwv-mi-left">
                  <span class="rwv-mi-icon">🌐</span>
                  <span>Open in Browser</span>
                </div>
              </div>
              <div class="rwv-menu-divider"></div>
              <div class="rwv-menu-item" id="rwv-mi-exit">
                <div class="rwv-mi-left">
                  <span class="rwv-mi-icon">✖️</span>
                  <span>Exit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- URL POPUP -->
        <div id="rwv-url-popup">
          <div id="rwv-url-box">
            <h3>Enter Termux URL</h3>
            <p>Insert your live server URL from Termux below to render the page.</p>
            <input type="url" id="rwv-url-input" placeholder="http://192.168.x.x:8080" autocomplete="off" autocorrect="off" spellcheck="false">
            <div class="rwv-url-actions">
              <button id="rwv-url-cancel">Cancel</button>
              <button id="rwv-url-confirm">Render</button>
            </div>
          </div>
        </div>

        <!-- URL POPUP -->
        <div id="rwv-toast">
          <span id="toast-icon"></span>
          <p id="toast-text"></p>
        </div>
      </div>
      
    `;
  }

  // Function to Close the overlay
  destroy() {
   if (this.container) {
    this.container.remove();
   }
  }

  // Function for toast. <<==========================================================
  showToast(message, icon = "", duration = 2500) {
   const toast = this.container?.querySelector("#rwv-toast");

   if (!toast) return;

   const toastIcon = toast.querySelector("#toast-icon");
   const toastText = toast.querySelector("#toast-text");

   toastIcon.textContent = icon;
   toastText.textContent = message;
   toast.classList.add("show");

   clearTimeout(this.toastTimer);

   this.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
   }, duration);
  }

  // Function for each button. <<==========================================================
  bindEvents() {
   const q = (sel) => this.container.querySelector(sel);

   q("#rwv-reload-btn").addEventListener("click", () => {
    const btn = q("#rwv-reload-btn");
    btn.classList.add("spinning");
    this.reload();
    setTimeout(() => btn.classList.remove("spinning"), 700);
   });

   q("#rwv-menu-btn").addEventListener("click", () => this.toggleMenu());
   q("#rwv-menu-overlay").addEventListener("click", (e) => {
    if (e.target === q("#rwv-menu-overlay")) this.closeMenu();
   });

   q("#rwv-menu")
    .querySelectorAll(".rwv-preset-btn")
    .forEach((btn) => {
     btn.addEventListener("click", () => {
      this.width = parseInt(btn.dataset.w);
      this.height = parseInt(btn.dataset.h);
      this.updateSliders();
      this.applySize();
      this.closeMenu();
     });
    });

   q("#rwv-mi-fitHeight").addEventListener("click", () => {
    this.fitHeight = !this.fitHeight;
    this.updateFitHeight();
   });

   q("#rwv-mi-url").addEventListener("click", () => {
    this.closeMenu();
    this.promptUrl();
   });
   q("#rwv-mi-console").addEventListener("click", () => {
    this.closeMenu();
    this.toggleEruda();
   });
   q("#rwv-mi-cache").addEventListener("click", () => {
    this.closeMenu();
    this.clearCache();
   });
   q("#rwv-mi-browser").addEventListener("click", () => {
    this.closeMenu();
    this.openInBrowser();
   });
   q("#rwv-mi-exit").addEventListener("click", () => {
    this.closeMenu();
    this.destroy();
   });

   q("#rwv-w-slider").addEventListener("input", (e) => {
    this.width = parseInt(e.target.value);
    q("#rwv-w-val").textContent = this.width;
    this.applySize();
   });

   q("#rwv-h-slider").addEventListener("input", (e) => {
    this.height = parseInt(e.target.value);
    q("#rwv-h-val").textContent = this.height;
    this.applySize();
   });

   q("#rwv-z-slider").addEventListener("input", (e) => {
    this.zoom = parseInt(e.target.value);
    q("#rwv-z-val").textContent = this.zoom;
    this.applyZoom();
   });

   this.bindHold("#rwv-w-minus", () => this.adjustValue("width", -1));
   this.bindHold("#rwv-w-plus", () => this.adjustValue("width", 1));
   this.bindHold("#rwv-h-minus", () => this.adjustValue("height", -1));
   this.bindHold("#rwv-h-plus", () => this.adjustValue("height", 1));
   this.bindHold("#rwv-z-minus", () => this.adjustValue("zoom", -1));
   this.bindHold("#rwv-z-plus", () => this.adjustValue("zoom", 1));

   q("#rwv-url-confirm").addEventListener("click", () => this.confirmUrl());
   q("#rwv-url-cancel").addEventListener("click", () =>
    q("#rwv-url-popup").classList.remove("show"),
   );
   q("#rwv-url-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") this.confirmUrl();
   });
  }

  // Function of increasing value of the icon (+/-). <<==========================================================
  // --> Normal tap = +1
  // --> Hold 0-2 sec. = +1
  // --> Hold 2-3 sec. = +10
  // --> Hold 3++ sec. = +100

  bindHold(selector, action) {
   const btn = this.container.querySelector(selector);
   if (!btn) return;

   const startHold = () => {
    action();
    this.holdStart = Date.now();
    this.holdTimer = setTimeout(() => {
     this.holdInterval = setInterval(() => {
      const elapsed = (Date.now() - this.holdStart) / 1000;
      const step = elapsed > 3 ? 100 : elapsed > 2 ? 10 : 1;
      for (let i = 0; i < step; i++) action();
     }, 80);
    }, 400);
   };

   const stopHold = () => {
    clearTimeout(this.holdTimer);
    clearInterval(this.holdInterval);
    this.holdTimer = null;
    this.holdInterval = null;
    this.holdStart = null;
   };

   btn.addEventListener("mousedown", startHold);
   btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startHold();
   });
   btn.addEventListener("mouseup", stopHold);
   btn.addEventListener("mouseleave", stopHold);
   btn.addEventListener("touchend", stopHold);
   btn.addEventListener("touchcancel", stopHold);
  }

  // Function of each Controler. <<==========================================================
  adjustValue(prop, delta) {
   if (prop === "width") {
    this.width = Math.min(MAX_SIZE, Math.max(MIN_SIZE, this.width + delta));
    this.container.querySelector("#rwv-w-slider").value = this.width;
    this.container.querySelector("#rwv-w-val").textContent = this.width;
   } else if (prop === "height") {
    this.height = Math.min(MAX_SIZE, Math.max(MIN_SIZE, this.height + delta));
    this.container.querySelector("#rwv-h-slider").value = this.height;
    this.container.querySelector("#rwv-h-val").textContent = this.height;
   } else if (prop === "zoom") {
    this.zoom = Math.min(200, Math.max(-90, this.zoom + delta));
    this.container.querySelector("#rwv-z-slider").value = this.zoom;
    this.container.querySelector("#rwv-z-val").textContent = this.zoom;
    this.applyZoom();
    return;
   }
   this.applySize();
  }

  // Funtion to kept the ratio of iFrame. <<==========================================================
  applySize() {
   requestAnimationFrame(() => {
    const shell = this.container.querySelector("#rwv-iframe-shell");
    const iframe = this.container.querySelector("#rwv-iframe");
    const wrap = this.container.querySelector("#rwv-viewport-wrap");
    if (!shell || !wrap) return;

    const containerWidth = wrap.clientWidth - 20;
    const ratio = this.height / this.width;
    const containerHeight = containerWidth * ratio;

    shell.style.width = containerWidth + "px";
    shell.style.height = containerHeight + "px";

    const scale = containerWidth / this.width;
    iframe.style.width = this.width + "px";
    iframe.style.height = this.height + "px";
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = "top left";

    const q = (sel) => this.container.querySelector(sel);
    q("#rwv-w-val").textContent = this.width;
    q("#rwv-h-val").textContent = this.height;
    q("#rwv-size-label").textContent = `${this.width} × ${this.height}`;
    q("#rwv-menu-size").textContent = `${this.width}×${this.height}`;
   });
  }

  // Function of Zoom controler. <<==========================================================
  applyZoom() {
   const iframe = this.container.querySelector("#rwv-iframe");
   if (!iframe) return;
   const scale = 1 + this.zoom / 100;
   iframe.style.transform = `scale(${scale})`;
   iframe.style.transformOrigin = "top left";
   iframe.style.width = 100 / scale + "%";
   iframe.style.height = 100 / scale + "%";
  }

  // Function of updating size by slider. <<==========================================================
  updateSliders() {
   const q = (sel) => this.container.querySelector(sel);
   q("#rwv-w-slider").value = this.width;
   q("#rwv-h-slider").value = this.height;
   q("#rwv-w-val").textContent = this.width;
   q("#rwv-h-val").textContent = this.height;
  }

  // Function of Lock height size. <<==========================================================
  updateFitHeight() {
   const q = (sel) => this.container.querySelector(sel);
   q("#rwv-toggle-fitHeight").classList.toggle("on", this.fitHeight);
   q("#rwv-h-row").style.display = this.fitHeight ? "none" : "flex";
   this.applySize();
  }

  // Function of Insert the server link. <<==========================================================
  promptUrl() {
   const q = (sel) => this.container.querySelector(sel);
   q("#rwv-url-input").value = this.url || "";
   q("#rwv-url-popup").classList.add("show");
   setTimeout(() => q("#rwv-url-input").focus(), 100);
  }

  // Fuction of (Render Button). <<==========================================================
  confirmUrl() {
   const input = this.container.querySelector("#rwv-url-input");
   const val = input.value.trim();
   if (!val) return;
   this.url = val;
   this.showToast("Server URL updated", "🔗");
   sessionStorage.setItem("rwv__url", val);
   this.container.querySelector("#rwv-url-popup").classList.remove("show");
   this.loadUrl();
  }

  // Fuction of link succesfully detcted. <<==========================================================
  loadUrl() {
   if (!this.url) return;
   const q = (sel) => this.container.querySelector(sel);
   const iframe = q("#rwv-iframe");
   q("#rwv-iframe-shell").style.display = "block";
   q("#rwv-empty").style.display = "none";
   let loaded = false;
   iframe.onload = null;
   iframe.onload = () => {
    loaded = true;
    this.showToast("Connected to live server", "✓");
   };
   clearTimeout(this.connectTimeout);
   this.connectTimeout = setTimeout(() => {
    if (!loaded) {
     this.showToast("Failed to connect", "⚠");
    }
   }, 5000);
   iframe.src = this.url;
   this.applySize();
  }

  // Function of (Reload Button). <<==========================================================
  reload() {
   const iframe = this.container.querySelector("#rwv-iframe");
   if (iframe && iframe.src) iframe.src = iframe.src;
  }

  // Funtion of (Clear Cache Button). <<==========================================================
  clearCache() {
   const iframe = this.container.querySelector("#rwv-iframe");
   if (!iframe || !this.url) return;
   const sep = this.url.includes("?") ? "&" : "?";
   iframe.src = this.url + sep + "_nocache=" + Date.now();
  }

  // Function of swicth to browser webview. <<==========================================================
  openInBrowser() {
   console.log("URL =", this.url);
   try {
    acode.exec("open-with", this.url);
   } catch (e) {
    console.error(e);
   }
  }

  // Function of Open Eruda Console. <<==========================================================
  toggleEruda() {
   if (window.eruda) {
    typeof eruda.show === "function" ? eruda.show() : eruda.init();
   } else {
    window.toast &&
     window.toast(
      "Eruda not available. Enable Console in Acode settings.",
      3000,
     );
   }
  }

  // Function of open he sidebar option. <<==========================================================
  toggleMenu() {
   this.menuOpen = !this.menuOpen;
   this.container
    .querySelector("#rwv-menu-overlay")
    .classList.toggle("open", this.menuOpen);
  }

  // Function of exit the sidebar option. <<==========================================================
  closeMenu() {
   this.menuOpen = false;
   this.container.querySelector("#rwv-menu-overlay").classList.remove("open");
  }

  // Function of Clean plugin state. <<==========================================================
  cleanup() {
   clearTimeout(this.holdTimer);
   clearInterval(this.holdInterval);
  }

  // Funtion of exit Plugin. <<==========================================================
  async destroy() {
   if (this.container) {
    this.container.remove();
    this.container = null;
   }
   window.removeEventListener("resize", this.onResize);
  }
 }

 if (window.acode) {
  const plugin = new ResponsiveWebView();

  acode.setPluginInit(PLUGIN_ID, async (baseUrl) => {
   acode.addCommand({
    name: "Open with Live server", // <----- Name of the command palette.
    command: "responsive-webview:toggle",
    bindKey: {
     win: "Ctrl-Shift-L",
     mac: "Command-Shift-L",
    },
    exec: () => {
     if (plugin.container) {
      plugin.destroy();
     } else {
      plugin.init();
     }
    },
   });
  });
 }
})();
