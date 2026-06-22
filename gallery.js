// +++ Melon's Micro Gallery Viewer v0.3 - https://melonking.net/melon?z=/free/software/gallery-maker +++
// Generalized: viewable photos are any <a> wrapping an <img> inside #photos or #log.

let al = {};

// Inject viewer code to the end of the body!
document.body.insertAdjacentHTML("beforeend", '<div id="js-viewer"><img id="js-viewer-img" src="" /><span><button id="js-viewer-prev" type="button">&lt;</button> <button id="js-viewer-next" type="button">&gt;</button></span></div>');

al.html = {};
al.html.viewer = document.getElementById("js-viewer");
al.html.viewer.style.display = "none";
al.html.viewerImg = document.getElementById("js-viewer-img");
al.html.viewerPrev = document.getElementById("js-viewer-prev");
al.html.viewerNext = document.getElementById("js-viewer-next");

al.isViewing = false;
al.index = -1;

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
