class TabSystem extends HTMLElement {
  constructor() {
    super();
    this.config = null;
    this.currentPhase = null;
  }

  async connectedCallback() {
    this.config = await fetch("/config.json").then((r) => r.json());
    this.setupPhaseTransition();
    this.render();
  }

  setupPhaseTransition() {
    // URLクエリパラメータをチェック
    const urlParams = new URLSearchParams(window.location.search);
    let forcePhase = urlParams.get("phase");

    // phaseパラメータがない場合、デフォルトで?phase=autoを付与
    if (!forcePhase) {
      urlParams.set("phase", "auto");
      const newUrl = window.location.pathname + "?" + urlParams.toString();
      window.history.replaceState({}, "", newUrl);
      forcePhase = "auto";
    }

    // 明示的なphase指定（1または2）の場合
    if (forcePhase === "1" || forcePhase === "2") {
      this.currentPhase = forcePhase;
      this.dataset.phase = this.currentPhase;
      // 明示的な指定がある場合は自動遷移は設定しない
      return;
    }

    // phase=autoまたはその他の値の場合は、時刻ベースの制御
    const finalPhaseDate = new Date(
      this.config.phases["2"].startTime.replace(" ", "T") + "+09:00"
    );
    const now = new Date();

    if (now >= finalPhaseDate) {
      this.currentPhase = "2";
    } else {
      this.currentPhase = "1";
      const timeUntilTransition = finalPhaseDate - now;
      setTimeout(() => {
        this.currentPhase = "2";
        this.render();
      }, timeUntilTransition);
    }

    this.dataset.phase = this.currentPhase;
  }

  render() {
    const phase = this.config.phases[this.currentPhase];
    this.dataset.phase = this.currentPhase;
    this.innerHTML = `
      ${phase.tabs
        .map(
          (tab, index) => `
        <input type="radio" name="tab" id="${tab.id}" ${
            index === 0 ? "checked" : ""
          } />
        <iframe class="${tab.id}-frame" 
          src="${tab.content.template || tab.content.url}" 
          allow="accelerometer; autoplay; camera; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; screen-wake-lock; usb; web-share; xr-spatial-tracking" 
          allowfullscreen="true"
          loading="eager"
          importance="high"
          referrerpolicy="no-referrer"
          sandbox="allow-downloads allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
          frameborder="0"></iframe>
      `
        )
        .join("")}
      
      <div class="tabs">
        ${phase.tabs
          .map(
            (tab) => `
          <label for="${tab.id}">
            <svg viewBox="0 0 24 24">
              <path d="${this.config.icons[tab.icon]}" />
            </svg>
            ${tab.label}
          </label>
        `
          )
          .join("")}
      </div>
    `;
  }
}

customElements.define("tab-system", TabSystem);
