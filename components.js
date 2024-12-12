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
    const finalPhaseDate = new Date(
      this.config.phases.final.startTime.replace(" ", "T") + "+09:00"
    );
    const now = new Date();

    if (now >= finalPhaseDate) {
      this.currentPhase = "final";
    } else {
      this.currentPhase = "initial";
      const timeUntilTransition = finalPhaseDate - now;
      setTimeout(() => {
        this.currentPhase = "final";
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
