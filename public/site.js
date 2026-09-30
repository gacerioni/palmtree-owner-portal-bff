const menuButton = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

if (menuButton && mobileNav) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.hidden = !open;
  });
  mobileNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      mobileNav.hidden = true;
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
    }
  });
}

const header = document.querySelector(".site-header");
if (header && document.body.classList.contains("home")) {
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

const subscribeForm = document.querySelector("#subscribe-form");
if (subscribeForm) {
  subscribeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    subscribeForm.querySelector(".subscribe-note").textContent = "Thanks. You're on the list.";
    subscribeForm.reset();
  });
}

fetch("/healthz")
  .then((response) => {
    if (!response.ok) throw new Error("Health check unavailable");
    return response.json();
  })
  .then(({ version, color }) => {
    document.querySelectorAll("[data-build-badge]").forEach((badge) => {
      badge.textContent = `v${version} · ${color}`;
    });
    const pill = document.createElement("a");
    pill.className = `release-pill release-pill--${color}`;
    pill.href = "/healthz";
    pill.setAttribute("aria-label", "Release currently serving this page");
    pill.innerHTML = `<span class="release-pill__dot"></span><span class="release-pill__color">${color}</span><span class="release-pill__version">v${version}</span>`;
    document.body.appendChild(pill);
  })
  .catch(() => {
    document.querySelectorAll("[data-build-badge]").forEach((badge) => {
      badge.textContent = "Build unavailable";
    });
  });

const ownerForm = document.querySelector("#owner-form");
if (ownerForm) {
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  const miles = (km) => Math.round(km * 0.621371);
  const date = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
  const loginView = document.getElementById("login-view");
  const dashboard = document.getElementById("dashboard");
  const error = document.getElementById("form-error");

  ownerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = ownerForm.querySelector("button[type=submit]");
    const { ownerId, vin, region } = Object.fromEntries(new FormData(ownerForm));
    error.textContent = "";
    button.disabled = true;
    button.firstChild.textContent = "Connecting… ";

    try {
      const sessionResponse = await fetch("/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, vins: [vin], region })
      });
      if (!sessionResponse.ok) throw new Error("Unable to start the demo session.");
      const { token } = await sessionResponse.json();
      const vehicleResponse = await fetch(`/vehicles/${encodeURIComponent(vin)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!vehicleResponse.ok) throw new Error("Vehicle not found. Check the demo VIN and try again.");
      const vehicle = await vehicleResponse.json();
      const unit = region === "NA" ? "mi" : "km";
      const distance = (km) => `${(unit === "mi" ? miles(km) : Math.round(km)).toLocaleString()} ${unit}`;
      const charge = Math.max(0, Math.min(100, Number(vehicle.batterySoc) || 0));
      text("welcome-label", `Welcome, ${ownerId}. Your vehicle is ready when you are.`);
      text("battery-value", `${charge}%`);
      document.getElementById("battery-ring").style.setProperty("--charge", `${charge}%`);
      text("range-value", distance(vehicle.rangeKm));
      text("detail-vin", vehicle.vin);
      text("detail-odometer", vehicle.odometerKm == null ? "—" : distance(vehicle.odometerKm));
      text("detail-software", vehicle.softwareVersion);
      text("detail-service", date(vehicle.nextServiceAt));
      text("last-seen", `Last updated ${date(vehicle.lastSeenAt)}`);
      const history = document.getElementById("charging-history");
      history.replaceChildren();
      if (vehicle.chargingHistory?.length) {
        for (const session of vehicle.chargingHistory) {
          const row = document.createElement("li");
          const location = document.createElement("span");
          location.textContent = session.location;
          const when = document.createElement("small");
          when.textContent = date(session.chargedAt);
          location.append(when);
          const added = document.createElement("strong");
          added.textContent = `+${session.energyKwh} kWh`;
          row.append(location, added);
          history.append(row);
        }
      } else {
        const empty = document.createElement("li");
        empty.textContent = "No charging sessions available.";
        history.append(empty);
      }
      loginView.hidden = true;
      dashboard.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      error.textContent = cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
    } finally {
      button.disabled = false;
      button.firstChild.textContent = "View my vehicle ";
    }
  });

  document.getElementById("signout").addEventListener("click", () => {
    dashboard.hidden = true;
    loginView.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
