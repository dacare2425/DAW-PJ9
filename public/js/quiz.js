let Quiz = {
    quizzes: [
        {
            title: "Timeline Quiz: Historia",
            questions: [
                { id: "francia", question: "País famoso por el uso de la guillotina:", img: "./img/francia.png", desc: "Revolución Francesa" },
                { id: "alemania", question: "País conocido por el holocausto:", img: "./img/alemania.png", desc: "Primera Guerra Mundial" },
                { id: "rusia", question: "País participante de la guerra fría:", img: "./img/rusia.png", desc: "Segunda Guerra Mundial" },
                { id: "italia", question: "País en el que se originó el imperio romano:", img: "./img/italia.png", desc: "Caída del Muro de Berlín" }
            ]
        },
        {
            title: "Timeline Quiz: Cultura",
            questions: [
                { id: "grecia", question: "País originario de los Juegos Olímpicos:", img: "./img/grecia.png", desc: "Primeros Juegos Olímpicos" },
                { id: "italia", question: "Obra famosa de la corriente renacentista:", img: "./img/renacimiento.jpg", desc: "Renacimiento" },
                { id: "inglaterra", question: "Obra famosa del autor William Shakespeare:", img: "./img/shakespeare.jpg", desc: "Obras de Shakespeare" },
                { id: "españa", question: "Obra famosa del pintor Pablo Picasso:", img: "./img/guernica.jpg", desc: "Pintura de Guernica" }
            ]
        }
    ],
    
    index: 0,
    
    loadQuiz() {
        const quiz = this.quizzes[this.index];
        document.getElementById('quiz-title').textContent = quiz.title;
        const timeline = document.getElementById('timeline');
        const drop = document.getElementById('drop');
        timeline.innerHTML = '';
        drop.innerHTML = '';

        quiz.questions.forEach(q => {
            const dropZone = document.createElement('div');
            dropZone.classList.add('drop-zone');
            dropZone.setAttribute('id', q.id);
            dropZone.innerHTML = `<span style="text-align:center">${q.question}</span>`;
            timeline.appendChild(dropZone);

            const img = document.createElement('img');
            img.classList.add('img');
            img.setAttribute('draggable', true);
            img.setAttribute('id', q.id);
            img.src = q.img;
            img.alt = q.desc;
            drop.appendChild(img);
        });

        this.initDragAndDrop();
    },

    initDragAndDrop() {
        const images = document.querySelectorAll('.img');
        const dropZones = document.querySelectorAll('.drop-zone');
        const result = document.getElementById('result');

        images.forEach(img => {
            img.addEventListener('dragstart', () => {
                img.classList.add('dragging');
            });

            img.addEventListener('dragend', () => {
                img.classList.remove('dragging');
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('over');
                const draggingEvent = document.querySelector('.img.dragging');
                if (draggingEvent && draggingEvent.id === zone.id) {
                    zone.appendChild(draggingEvent);
                    this.checkCompletion();
                } else {
                    result.textContent = 'Inténtalo de nuevo!';
                    result.style.color = 'red';
                }
            });
        });
    },

    checkCompletion() {
        if (document.querySelectorAll('.drop .img').length === 0) {
            const result = document.getElementById('result');
            if (this.index === 1) {
                result.textContent = 'Felicitaciones, has superado el quiz';
                result.style.color = 'green';
            } else {
                this.index = (this.index + 1) % this.quizzes.length;
                this.loadQuiz();
            }
        }
    }
};

export { Quiz };