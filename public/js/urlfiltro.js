let historicos = document.getElementById('historicos');
let economicos = document.getElementById('economicos');
let culturales = document.getElementById('culturales');
let tecnologicos = document.getElementById('tecnologicos');

let consecuencias_efectos = document.getElementById('consecuencias_efectos');
let oportunidades = document.getElementById('oportunidades');
let analisis_demografico = document.getElementById('analisis_demografico');
let proyecciones_a_futuro = document.getElementById('proyecciones_a_futuro');
let posibles_soluciones = document.getElementById('posibles_soluciones');

let Fetch = {
    cargarInformacionPais: function(pais) {
        fetch('info.json') 
            .then(response => response.json()) 
            .then(data => {
                const paisData = data.paises.find(p => p.pais === pais); 

                if (!paisData) {
                    document.getElementById('paisInfo').innerHTML = '<p>Información no disponible para este país.</p>';
                    return;
                }

                let html = `<h2>Información sobre ${pais}</h2>`;
                
                if (historicos.checked) {
                    html += `<h4>Históricos</h4><ul>`;
                    paisData.Factores.historicos.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (culturales.checked) {
                    html += `<h4>Culturales</h4><ul>`;
                    paisData.Factores.culturales.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (tecnologicos.checked) {
                    html += `<h4>Tecnológicos</h4><ul>`;
                    paisData.Factores.tecnologicos.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (economicos.checked) {
                    html += `<h4>Económicos</h4><ul>`;
                    paisData.Factores.economicos.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }

                if (consecuencias_efectos.checked) {
                    html += `<h3>Consecuencias y Efectos</h3><ul>`;
                    paisData.Consecuencias.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (oportunidades.checked) {
                    html += `<h3>Oportunidades</h3><ul>`;
                    paisData.Oportunidades.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (analisis_demografico.checked) {
                    html += `<h3>Análisis Demográfico</h3><ul>`;
                    paisData.Analisis_demografico.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (proyecciones_a_futuro.checked) {
                    html += `<h3>Proyecciones a Futuro</h3><ul>`;
                    paisData.Proyecciones_a_futuro.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }
                if (posibles_soluciones.checked) {
                    html += `<h3>Posibles Soluciones</h3><ul>`;
                    paisData.Posibles_soluciones.forEach(item => {
                        html += `<li>${item}</li>`;
                    });
                    html += `</ul>`;
                }

                document.getElementById('paisInfo').innerHTML = html;
            })
            .catch(error => {
                console.error('Error al cargar el archivo JSON:', error);
                document.getElementById('paisInfo').innerHTML = '<p>No se pudo cargar la información.</p>';
            });
    },

    actualizarInformacion: function() {
        const paisSeleccionado = document.getElementById('paisSelect').value;
        Fetch.cargarInformacionPais(paisSeleccionado);
    }
};

let checkboxManager = {
    checkboxes: document.querySelectorAll('input[type="checkbox"]'),

    guardar: function(id, isChecked) {
        localStorage.setItem(id, isChecked); 
    },

    mostrar: function() {
        checkboxManager.checkboxes.forEach(checkbox => {
            const isChecked = localStorage.getItem(checkbox.id) === 'true';
            checkbox.checked = isChecked;
        });
    },

    cambio: function() {
        checkboxManager.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                checkboxManager.guardar(checkbox.id, checkbox.checked); 
                Fetch.actualizarInformacion();
            });
        });
    }
};

export { Fetch, checkboxManager };
