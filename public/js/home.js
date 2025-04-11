let canvas = {
    iniciar: function() {
        var canva = document.getElementById('canva');
        var ctx = canva.getContext('2d');
    
        
        const BASE_WIDTH = 1920;
        const BASE_HEIGHT = 1080;
    
        var squares = [
            { x: 650, y: 110, width: 150, height: 100, color: 'transparent', url: "Islandia" },
            { x: 710, y: 500, width: 80, height: 80, color: 'transparent', url: "Irlanda" },
            { x: 800, y: 400, width: 120, height: 200, color: 'transparent', url: "UK" },
            { x: 820, y: 660, width: 200, height: 150, color: 'transparent', url: "Francia" },
            { x: 700, y: 820, width: 185, height: 150, color: 'transparent', url: "España" },
            { x: 1050, y: 520, width: 110, height: 180, color: 'transparent', url: "Alemania" },
            { x: 990, y: 550, width: 40, height: 60, color: 'transparent', url: "Holanda" },
            { x: 965, y: 610, width: 50, height: 30, color: 'transparent', url: "Bélgica" },
            { x: 1025, y: 705, width: 80, height: 50, color: 'transparent', url: "Suiza" },
            { x: 1075, y: 770, width: 180, height: 280, color: 'transparent', url: "Italia" },
            { x: 1160, y: 725, width: 60, height: 50, color: 'transparent', url: "Slovenia" },
            { x: 620, y: 820, width: 60, height: 150, color: 'transparentn', url: "Portugal" },
            { x: 1140, y: 680, width: 90, height: 50, color: 'transparent', url: "Austria" },
            { x: 1160, y: 620, width: 100, height: 50, color: 'transparent', url:"Chequia" },
            { x: 1250, y: 650, width: 100, height: 45, color: 'transparent', url:"Eslovaquia" },
            { x: 1240, y: 700, width: 100, height: 45, color: 'transparent', url:"Hungria" },
            { x: 1190, y: 500, width: 150, height: 150, color: 'transparent', url:"Polonia" },
            { x: 1150, y: 150, width: 75, height: 350, color: 'transparent', url:"Suecia" },
            { x: 1025, y: 250, width: 100, height: 200, color: 'transparent', url:"Noruega" },
            { x: 1250, y: 150, width: 125, height: 200, color: 'transparent', url:"Finlandia" },
            { x: 1025, y: 460, width: 100, height: 50, color: 'transparent', url:"Dinamarca" },
            { x: 1250, y: 460, width: 125, height: 50, color: 'transparent', url:"Lituania" },
            { x: 1270, y: 410, width: 125, height: 50, color: 'transparent', url:"Latvia" },
            { x: 1315, y: 360, width: 75, height: 50, color: 'transparent', url:"Estonia" },
            { x: 1470, y: 20, width: 300, height: 500, color: 'transparent', url:"Rusia" },
            { x: 1370, y: 550, width: 300, height: 150, color: 'transparent', url:"Ucrania" },
            { x: 1520, y: 800, width: 250, height: 150, color: 'transparent', url:"Turquia" },
            { x: 1350, y: 450, width: 125, height: 100, color: 'transparent', url:"Belarus" },
            { x: 1350, y: 675, width: 125, height: 100, color: 'transparent', url:"Romania" },
            { x: 1400, y: 775, width: 100, height: 75, color: 'transparent', url:"Bulgaria" },
            { x: 1200, y: 745, width: 100, height: 45, color: 'transparent', url:"Croacia" },
            { x: 1300, y: 745, width: 80, height: 90, color: 'transparent', url:"Serbia" },
            { x: 1280, y: 800, width: 40, height: 45, color: 'transparent', url:"Montenegro" },
            { x: 1260, y: 775, width: 40, height: 45, color: 'transparent', url:"Bosnia" },
            { x: 1320, y: 840, width: 40, height: 50, color: 'transparent', url:"Albania" },
            { x: 1360, y: 835, width: 40, height: 40, color: 'transparent', url:"Macedonia" },
            { x: 1330, y: 880, width: 180, height: 100, color: 'transparent', url:"Macedonia" },
            { x: 1680, y: 950, width: 50, height: 30, color: 'transparent', url:"Macedonia" },
        ];
    
        function draw() {
            canva.width = window.innerWidth * 0.9;
            canva.height = window.innerHeight * 0.9;
    
            let scaleX = canva.width / BASE_WIDTH;
            let scaleY = canva.height / BASE_HEIGHT;
    
            var img = new Image();
            img.src = '../img/71vs.webp';
            img.onload = function() {
        console.log('Imagen cargada con éxito');
        ctx.drawImage(img, 0, 0, canva.width, canva.height);
    };
    
    img.onerror = function() {
        console.log('Error al cargar la imagen');
    };
    
            img.onload = function () {
                ctx.drawImage(img, 0, 0, canva.width, canva.height);
    
                squares.forEach(square => {
                    ctx.fillStyle = square.color;
                    ctx.fillRect(
                        square.x * scaleX,
                        square.y * scaleY,
                        square.width * scaleX,
                        square.height * scaleY
                    );
                });
            };
        }
    
        window.addEventListener('resize', draw);
    
        canva.addEventListener('mousemove', function (event) {
            var rect = canva.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
    
            var scaleX = canva.width / BASE_WIDTH;
            var scaleY = canva.height / BASE_HEIGHT;
    
            var isOverSquare = false;
            squares.forEach(square => {
                let scaledX = square.x * scaleX;
                let scaledY = square.y * scaleY;
                let scaledWidth = square.width * scaleX;
                let scaledHeight = square.height * scaleY;
    
                if (x >= scaledX && x <= scaledX + scaledWidth &&
                    y >= scaledY && y <= scaledY + scaledHeight) {
                    canva.style.cursor = 'pointer';
                    isOverSquare = true;
                }
            });
    
            if (!isOverSquare) {
                canva.style.cursor = 'default';
            }
        });
    
        canva.addEventListener('click', function (event) {
            var rect = canva.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
    
            var scaleX = canva.width / BASE_WIDTH;
            var scaleY = canva.height / BASE_HEIGHT;
    
            squares.forEach(square => {
                let scaledX = square.x * scaleX;
                let scaledY = square.y * scaleY;
                let scaledWidth = square.width * scaleX;
                let scaledHeight = square.height * scaleY;
    
                if (x >= scaledX && x <= scaledX + scaledWidth &&
                    y >= scaledY && y <= scaledY + scaledHeight) {
                    window.location.href = "urlFiltro.html?pais=" + square.url;
                }
            });
        });
    
        draw();
    }
};

let frontend = {
        mostrarBoton() {
            const usuarioStr = localStorage.getItem("usuario");
            const userMenu = document.getElementById("user-menu");
        
            userMenu.innerHTML = "";
        
            if (usuarioStr) {
                const usuario = JSON.parse(usuarioStr);
        
                if (usuario.rol === "admin") {
                    userMenu.innerHTML += `<li><a href="admin.html">Administración</a></li>`;
                }
                userMenu.innerHTML += `<li><a id="logout">Log out</a</li>`;
                userMenu.innerHTML += `<li><a href="register.html">Register</a></li>`;
            } else {
                userMenu.innerHTML = `<li><a href="login.html">Login</a></li>`;
                userMenu.innerHTML += `<li><a href="register.html">Register</a></li>`;
        
            }
        },
        
        logout() {
            localStorage.removeItem("usuario");
            window.location.href = "index.html";
            frontend.mostrarBoton();
        }
};

export { canvas, frontend };
