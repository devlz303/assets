const baseUrl = 'https://www.ord.io/content/';
      const collectionUrl = 'collection.json'; // --> replace by inscription id 
      const tempBaseUrl = 'https://raw.githubusercontent.com/devlz303/assets/master/';
      
      const qs = window.location.search.length ? window.location.search.substring(1).split('&') : [];
      const inscriptionId = getQSValue('id', 'a04bc334d05098b16a400a688e41bc0ccbdd1ebf074f361e70271ec338e78373i0');
      const cardColor = getQSValue('color', 'white');
      const currentSide = getQSValue('side', 'front');

      const cardColors = {
        white: { s: 'eeeeee', g: 'ffffff' },
        black: { s: '202020', g: '353535' },
        orange: { s: 'f17b00', g: 'ff9b19' },
        silver: { s: '888888', g: 'eeeeee' },
        gold: { s: 'ae9244', g: 'efda78' },
        anthracite: { s: 'ccc', g: 'ccc' },
        purple: { s: 'ccc', g: 'ccc' }
      }

      const css = `
        @font-face {
          font-family: 'Poppins';
          src: url('https://ordinals.com/content/a90c1c2ea06ae83c56e5c078b7c8855644e19d3f01d2a1f73d8c758b0c48f201i0') format('woff2');
          font-style: normal;
          font-weight: 400;
        }

        @font-face {
          font-family: 'Poppins';
          src: url('https://ordinals.com/content/4e139ae3b0376e42c364b901bd0f483d4d6ec2d5f7830a8d1e451a245583a43ei0') format('woff2');
          font-style: normal;
          font-weight: 600;
        }
    
        * {
          outline: none;
          box-sizing: border-box;
          user-select: none;
        }
        
        body {
          background: #000000;
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: 'Poppins', Helvetica, sans-serif;
          font-size: 16px;
          line-height: 1.6em;
        }

        #container {
          display: none;
          cursor: grab;
        }

        #container.black {
          color: #ddd;
        }

        #container:active {
          cursor: grabbing;
        }

        .card {
          width: 400px;
          height: 600px;
          border-radius: 20px;
          padding: 20px;
          font-weight: 400;
          font-style: normal;
          background: transparent;
        }

        .card.solid {
          background: #eeeeee;
        }

        .card.overlay {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgb(255, 255, 255) 45%, rgb(255, 255, 255) 55%, rgba(255, 255, 255, 0) 100%);
        }

        .s {
          font-weight: 400;
          font-size: 1em;
        }

        .t {
          font-weight: 600;
          font-size: 1.6em;
        }
        
        img {
          margin: 20px 0 20px 0;
          width: 100%;
          height: auto;
        }

        .footer {
          display: flex;
          flex-direction: row;
          position: absolute;
          width: calc(100% - 40px);
          bottom: 20px;
        }
        
        .right {
          flex: 1;
        }

        .title {
          text-align: center;
          text-transform: uppercase;
          font-size: 1.4em;
          margin: 0 0 20px 0;
        }

        .grid {
          display: grid;
          grid-template-columns: 180px 180px;
          grid-template-rows: 80px 80px 80px 80px 80px 80px;
          column-gap: 10px;
          row-gap: 10px;
        }

        .trait {
          border: 1px solid #575050;
          border-radius: 8px;
          text-align: center;
          align-items: center;
          padding: 10px;
          font-size: .9em;
          line-height: 1.4em;
        }

        .type {
          text-transform: uppercase;
          letter-spacing: .02em;
        }

        .value {
          font-weight: 800;
        }

        .count {
          letter-spacing: .02em;
        }
      `;

      let camera, scene, renderer, controls, styleRules;

      window.addEventListener("load", () => init());

      async function init() {
        if (typeof THREE !== 'object') return setTimeout(async () => await init(), 10);
        
        document.getElementsByTagName('style')[0].appendChild(document.createTextNode(css));
        styleRules = getCssStyleRules(['.card.overlay', '.card.solid']);

        let json = await getJson(collectionUrl);
        let item = json.items.find(x => x.inscription_id === inscriptionId);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.z = 1100;
        
        scene = new THREE.Scene();
        
        // frontside - layer for image and text on top of overlay
        createCardLayer('front', '', `
          <div class='t'>${item.name}</div>
          <div class='s'>${item.rarity}</div>
          <img src='${baseUrl}${inscriptionId}' draggable='false' onload='(() => { document.getElementById("container").style.display = "block" })()'>
          <div class='t'>#${item.number}</div>
          <div class='s'>${getSubText(item.number)}</div>
          <div class='footer'>
            <div class='right'>${(item.content_length / 1000).toFixed(2)} KB</div>
            <div>${json.collection.name}</div>
          </div>
          `,
        2);

        // frontside - shiny overlay
        createCardLayer('front', 'overlay', '', 1);
      
        // static color
        createCardLayer('both', 'solid', '', 0);

        // backside - shiny overlay
        createCardLayer('back', 'overlay', '', 1);

        // backside - traits
        createCardLayer('back', '', `
          <div class='title'>traits</div>
            <div class='grid'>${item.attributes.map(o =>
            `<div class='trait'>
              <div class='type'>${o.trait_type}</div>
              <div class='value'>${o.value}</div>
              <div class='count'>${o.count}</div>
            </div>`).join('')}
          </div>
          `,
        2);

        renderer = new CSS3DRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        
        const container = document.getElementById( 'container' );
        container.className  = cardColor;
        container.appendChild( renderer.domElement );

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;
        controls.minDistance = 600;
        controls.maxDistance = 2000;
        controls.minPolarAngle = Math.PI * 2 / 10;
        controls.maxPolarAngle = Math.PI * 9 / 10;
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }
        controls.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_ROTATE
        }
        controls.addEventListener('change', render);
        controls.update();
        window.addEventListener('resize', onWindowResize);
        
        render();
      }

      function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
        render();
      }

      function render() {
        setStyleRules(camera);
        renderer.render( scene, camera );
      }

      async function getJson(url) {
        let data = await new THREE.FileLoader().loadAsync(`${tempBaseUrl}${collectionUrl}`);
        return JSON.parse(data);
      }

      function getSubText(n) {
        return n >= 1000000 ? '' : `Sub${n < 50000 ? '50K' : n < 100000 ? '100K' : '1M'}`
      }

      function getQSValue(key, defaultVal) {
        var param = qs.find(x => x.indexOf(key + '=') === 0);
        return param ? param.split('=')[1] : defaultVal;
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

      function setStyleRules() {
        const degY = parseInt(THREE.MathUtils.radToDeg(camera.rotation.y));
        const width = 10;

        let correction = parseInt(degY / 2);
        let pos1 = Math.min(Math.max(50 - width / 2 + correction, 0), 100);
        if (camera.position.z < 0) pos1 = 100 - pos1 - width; 
        let pos2 = Math.min(Math.max(pos1 + width, 0), 100);

        const colors = cardColors[cardColor];
        const rgb = convertToRGB(colors.g);
        
        styleRules['.card.solid'].style.background = `#${colors.s}`;
        styleRules['.card.overlay'].style.background = `linear-gradient(90deg, rgba(${rgb.join(',')},0) 0%, rgba(${rgb.join(',')},1) ${pos1}%, rgba(${rgb.join(',')},1) ${pos2}%, rgba(${rgb.join(',')},0) 100%)`;
      }

      function createCardLayer(side = 'both', className = '', innerHTML = '', zIndex = 0) {
        const container = document.createElement('div');
        container.className = `card ${className}`;
        container.innerHTML = innerHTML;
        
        const obj = new CSS3DObject( container );
        obj.position.z = zIndex;
        
        // TODO: only needed for debugging, so remove this for production
        if (side !== 'both' && currentSide !== side) {
          obj.rotation.set(0, Math.PI, 0);
          obj.position.z = -zIndex;
        }
                
        scene.add( obj );
      }

      function convertToRGB (hex) {
        var aRgbHex = hex.match(/.{1,2}/g);
        var aRgb = [
            parseInt(aRgbHex[0], 16),
            parseInt(aRgbHex[1], 16),
            parseInt(aRgbHex[2], 16)
        ];
        return aRgb;
      }