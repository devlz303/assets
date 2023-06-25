const baseUrl = "https://www.ord.io/content/";
const collectionUrl = "collection.json"; // --> replace by inscription id
const tempBaseUrl = "https://raw.githubusercontent.com/devlz303/assets/master/";
const cardColor = "black";
const cssStyleRules = getCssStyleRules([".card.overlay"]);

let camera, scene, renderer, controls, container;

window.addEventListener("load", () => init());

async function init() {
  container = document.getElementById("container");
  let inscriptionId = container.dataset.inscription;

  let json = await getJson(collectionUrl);
  let item = json.items.find((x) => x.inscription_id === inscriptionId);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    2000
  );
  camera.position.z = 1100;

  scene = new THREE.Scene();

  updateGradient();

  // frontside - shiny overlay
  createCardLayer("front", "overlay", "", 1);

  // frontside - layer for image and text on top of overlay
  createCardLayer(
    "front",
    `${cardColor} transparent`,
    `
    <div>
      <div class='t'>${item.name}</div>
      <div class='s'>${item.rarity}</div>
    </div>
    <img src='${baseUrl}${inscriptionId}' onload='(() => { document.getElementById("container").style.display = "block" })()'>
    <div>
      <div class='t'>#${item.number}</div>
      <div class='s'>${getSubText(item.number)}</div>
    </div>
    <div class='footer'>
      <div class='right'>${(item.content_length / 1000).toFixed(2)} KB</div>
      <div>${json.collection.name}</div>
    </div>`,
    1
  );

  // frontside - card layout with static background color
  createCardLayer("front", cardColor, ``, 0);

  // backside - traits
  createCardLayer("back", cardColor, "", 0);

  // backside - shiny overlay
  createCardLayer("back", "overlay", "", 1);

  // backside - traits
  createCardLayer(
    "back",
    `${cardColor} transparent`,
    `
    <div class='title'>traits</div>
    <div class='grid'>${item.attributes
      .map(
        (o) =>
          `<div class='trait'>
        <div class='type'>${o.trait_type}</div>
        <div class='value'>${o.value}</div>
        <div class='count'>${o.count}</div>
      </div>`
      )
      .join("")}
    </div>`,
    1
  );

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;
  controls.minDistance = 600;
  controls.maxDistance = 2000;
  controls.minPolarAngle = (Math.PI * 2) / 10;
  controls.maxPolarAngle = (Math.PI * 9) / 10;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_ROTATE,
  };
  controls.addEventListener("change", render);
  controls.update();
  window.addEventListener("resize", onWindowResize);

  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  updateGradient(camera);
  renderer.render(scene, camera);
}

async function getJson(url) {
  let data = await new THREE.FileLoader().loadAsync(
    `${tempBaseUrl}${collectionUrl}`
  );
  return JSON.parse(data);
}

function getSubText(n) {
  return n >= 1000000
    ? ""
    : `Sub${n < 50000 ? "50K" : n < 100000 ? "100K" : "1M"}`;
}

function getCssStyleRules(find) {
  let sheet = document.styleSheets[0];
  let rules = sheet.cssRules || sheet.rules;
  const o = {};

  for (var i = 0; i < rules.length; i++) {
    let rule = rules[i];
    if (find.indexOf(rule.selectorText) === -1) continue;
    o[rule.selectorText] = rule;
  }

  return o;
}

function updateGradient() {
  const degY = parseInt(THREE.MathUtils.radToDeg(camera.rotation.y));
  let pos1 = Math.min(parseInt(degY / 2) + 45, 100);
  if (camera.position.z < 0) pos1 = 100 - pos1 - 10;
  const pos2 = Math.min(pos1 + 10, 100);
  cssStyleRules[
    ".card.overlay"
  ].style.background = `linear-gradient(90deg, rgba(134,134,134,1) 0%, rgba(242,242,242,1) ${pos1}%, rgba(242,242,242,1) ${pos2}%, rgba(134,134,134,1) 100%)`;
}

function createCardLayer(
  side = "front",
  className = "",
  innerHTML = "",
  zIndex = 0
) {
  const container = document.createElement("div");
  container.className = `card ${className}`;
  container.innerHTML = innerHTML;

  const obj = new CSS3DObject(container);
  
  obj.position.z = zIndex;
  if (side === "back") {
    obj.rotation.set(0, Math.PI, 0);
    obj.position.z = -zIndex;
  }

  scene.add(obj);
}
