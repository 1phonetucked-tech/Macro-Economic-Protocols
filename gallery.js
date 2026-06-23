// +++ Melon's Micro Gallery Viewer v0.3 - https://melonking.net/melon?z=/free/software/gallery-maker +++
// Generalized: viewable photos are any <a> wrapping an <img> inside #photos or #log.
// Plus an ambient terminal `ping` readout (see initPing) that runs on every page
// that loads this script.

let al = {};

// All viewable photo links, in document order.
function photoLinks() {
    return Array.from(document.querySelectorAll("#photos a, #log a")).filter((a) => a.querySelector("img"));
}

function hideViewer() {
    al.isViewing = false;
    al.html.viewer.style.display = "none";
}

// Open the viewer at a given index in the photo list.
function showIndex(i) {
    const links = photoLinks();
    if (i < 0 || i >= links.length) return;
    al.index = i;
    al.isViewing = true;
    al.html.viewerImg.src = ""; // Clear photo so it does not appear to lag
    al.html.viewerImg.src = links[i].href;
    al.html.viewer.style.display = "";
    al.html.viewerPrev.style.display = i > 0 ? "" : "none";
    al.html.viewerNext.style.display = i < links.length - 1 ? "" : "none";
}

// Only set up the lightbox on pages that actually have photos (#photos / #log).
// The homepage loads this script for the ping readout but has neither, so we skip.
function initViewer() {
    if (!document.querySelector("#photos, #log")) return;

    document.body.insertAdjacentHTML("beforeend", '<div id="js-viewer"><img id="js-viewer-img" src="" /><span><button id="js-viewer-prev" type="button">&lt;</button> <button id="js-viewer-next" type="button">&gt;</button></span></div>');

    al.html = {};
    al.html.viewer = document.getElementById("js-viewer");
    al.html.viewer.style.display = "none";
    al.html.viewerImg = document.getElementById("js-viewer-img");
    al.html.viewerPrev = document.getElementById("js-viewer-prev");
    al.html.viewerNext = document.getElementById("js-viewer-next");

    al.isViewing = false;
    al.index = -1;

    document.addEventListener("click", (e) => {
        // Photo Viewing Events!
        const link = e.target.closest("#photos a, #log a");
        if (link && link.querySelector("img")) {
            e.preventDefault();
            showIndex(photoLinks().indexOf(link));
            return;
        }
        // Viewer Hide!
        if (e.target.id == "js-viewer") hideViewer();
        // Prev Button Event
        if (e.target.id == "js-viewer-prev") showIndex(al.index - 1);
        // Next Button Event
        if (e.target.id == "js-viewer-next") showIndex(al.index + 1);
    });

    document.addEventListener("keyup", (e) => {
        if (!al.isViewing) return;
        if (e.key === "Escape") hideViewer();
        if (e.key === "ArrowLeft") showIndex(al.index - 1);
        if (e.key === "ArrowRight") showIndex(al.index + 1);
    });
}

// Ambient `ping` readout: a rolling 3-line tail with a REAL measured round-trip
// for time= (a tiny cache-busted fetch of a static asset — no serverless cost),
// falling back to a simulated value if the request fails. Decorative only.
function initPing() {
    if (document.getElementById("pt-ping")) return; // init guard

    const HOST = "phonetucked.dev";
    const IP = "76.76.21.21";          // Vercel's anycast IP (decorative)
    const PROBE = "/manifest.json";    // tiny static asset; absolute path works from any subdir
    const MAX_LINES = 3;

    const box = document.createElement("div");
    box.id = "pt-ping";
    box.className = "ping";
    box.setAttribute("aria-hidden", "true");

    const head = document.createElement("div");
    head.className = "ping-h";
    head.textContent = "PING " + HOST + " (" + IP + ")";
    box.appendChild(head);

    const tail = document.createElement("div");
    tail.className = "ping-b";
    box.appendChild(tail);

    // Homepage: tuck the readout under the logo (inside .home-stack). Elsewhere:
    // append to <body> and let CSS pin it bottom-left.
    const stack = document.body.classList.contains("home") && document.querySelector(".home-stack");
    (stack || document.body).appendChild(box);

    let seq = 0;

    async function measure() {
        const t0 = performance.now();
        try {
            await fetch(PROBE + "?_=" + Date.now(), { cache: "no-store", method: "HEAD" });
            return performance.now() - t0;
        } catch (e) {
            return null; // signal fallback
        }
    }

    function sim() {
        return 10 + Math.random() * 6; // believable 10–16 ms
    }

    async function tick() {
        if (!document.hidden) {
            let ms = await measure();
            if (ms == null) ms = sim();
            const line = document.createElement("div");
            line.textContent = "64 bytes: seq=" + seq + " ttl=64 time=" + ms.toFixed(1) + " ms";
            tail.appendChild(line);
            seq++;
            while (tail.children.length > MAX_LINES) tail.removeChild(tail.firstChild);
        }
        setTimeout(tick, 1000);
    }

    tick();
}

initViewer();
initPing();
