


// Referencias al DOM
const addPinButton = document.getElementById('addPinButton');
const pinForm = document.getElementById('pinForm');
const pinDataForm = document.getElementById('pinDataForm');
const cancelButton = document.getElementById('cancelButton');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const infoTitle = document.getElementById('info-title');
const infoText = document.getElementById('info-text');
const infoImage = document.getElementById('info-image');

let tempMarker = null;
let selectedCoords = null;
let currentMarker = null; // Almacena el marcador seleccionado para acciones (eliminar/actualizar)


// Inicializar el mapa
const map = L.map('map').setView([-33.7385860, -70.6795552], 16);

// Agregar capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Crear el control de búsqueda usando Leaflet Control Geocoder
L.Control.geocoder({
    position: 'topright',  // Posicionar en la esquina superior derecha
    placeholder: 'Buscar dirección...', // Texto de marcador de posición en el cuadro de búsqueda
    errorMessage: 'Dirección no encontrada', // Mensaje de error si no se encuentra la dirección
}).addTo(map);


// Inicializar íconos
const grifoIcon = L.icon({
    iconUrl: 'iconos/grifoverde.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [1, -34],
});

const grifoMalEstadoIcon = L.icon({
    iconUrl: 'iconos/griforojo.png', // Ruta del icono para "Grifo en mal estado"
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [1, -34],
});

const accesoIcon = L.icon({
    iconUrl: 'iconos/door.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [1, -34],
});

// Guardar los datos de los pines en localStorage
function guardarPinesEnLocalStorage(pines) {
    localStorage.setItem('pines', JSON.stringify(pines));
}

// Cargar los pines desde localStorage
function cargarPinesDesdeLocalStorage() {
    const pinesGuardados = JSON.parse(localStorage.getItem('pines')) || [];
    pinesGuardados.forEach(pin => {
        agregarMarcador(pin.name, pin.description, pin.imageUrl, pin.pinType, pin.coords);
    });
}

// Función para agregar un marcador al mapa
function agregarMarcador(name, description, imageUrl, pinType, coords = null) {
    sidebar.classList.remove('open'); // Cerrar la pestaña lateral
    let icon;

    // Asignar el ícono dependiendo del tipo de pin
    switch (pinType) {
        case 'acceso':
            icon = accesoIcon;
            break;
        case 'grifo_mal_estado':
            icon = grifoMalEstadoIcon;
            break;
        default:
            icon = grifoIcon;
    }

    const markerCoords = coords || selectedCoords;

    const marker = L.marker([markerCoords.lat, markerCoords.lng], { icon }).addTo(map)
        .bindPopup(`
            <h3>${name}</h3>
            <p>${description}</p>
            ${imageUrl ? `<img src="${imageUrl}" alt="${name}" style="width: 100%; border-radius: 5px;">` : ''}
        `)
        .on('click', () => {
            showSidebar({ title: name, text: description, image: imageUrl }, marker);
        });

    // **Nuevo cambio: Abrir el popup automáticamente al pasar el cursor sobre el ícono**
    marker.on('mouseover', () => {
        marker.openPopup(); // Abre el popup automáticamente al pasar el mouse
    });

    marker.on('mouseout', () => {
        marker.closePopup(); // Cierra el popup cuando el mouse sale del ícono
    });

    // Guardar el pin en localStorage
    if (!coords) {
        const pinesGuardados = JSON.parse(localStorage.getItem('pines')) || [];
        pinesGuardados.push({
            name,
            description,
            imageUrl,
            pinType,
            coords: markerCoords,
        });
        guardarPinesEnLocalStorage(pinesGuardados);
    }

    showSidebar({ title: name, text: description, image: imageUrl }, marker);

    pinForm.classList.add('hidden');
    pinDataForm.reset();

    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = null;
    selectedCoords = null;
}

// Función para mostrar información en la pestaña lateral
function showSidebar(data, marker) {
    pinForm.classList.add('hidden');
    infoTitle.textContent = data.title || 'Sin título';
    infoText.textContent = data.text || 'Sin descripción';
    infoImage.src = data.image || '';
    infoImage.style.display = data.image ? 'block' : 'none';

    sidebar.classList.add('open');
    currentMarker = marker; // Almacenar el marcador seleccionado
}


// Eliminar el pin seleccionado
document.getElementById('deletePinButton').addEventListener('click', () => {
    if (currentMarker) {
        map.removeLayer(currentMarker); // Eliminar marcador del mapa
        sidebar.classList.remove('open'); // Cerrar la pestaña lateral
        currentMarker = null; // Limpiar el marcador seleccionado

        // Actualizar localStorage
        const pinesGuardados = JSON.parse(localStorage.getItem('pines')) || [];
        const nuevosPines = pinesGuardados.filter(pin =>
            pin.coords.lat !== currentMarker.getLatLng().lat ||
            pin.coords.lng !== currentMarker.getLatLng().lng
        );
        guardarPinesEnLocalStorage(nuevosPines);
    }
});

// Actualizar la información del pin
document.getElementById('updatePinButton').addEventListener('click', () => {
    if (currentMarker) {
        // Obtener información actual del marcador
        const name = infoTitle.textContent;
        const description = infoText.textContent;
        const image = infoImage.src;
        sidebar.classList.remove('open');

        // Mostrar formulario con la información actual
        pinForm.classList.remove('hidden');
        document.getElementById('pinName').value = name;
        document.getElementById('pinDescription').value = description;

        // Manejar actualización al guardar
        pinDataForm.onsubmit = (event) => {
            event.preventDefault();

            const newName = document.getElementById('pinName').value;
            const newDescription = document.getElementById('pinDescription').value;
            const file = document.getElementById('pinImage').files[0];
            let newImage = image; // Mantener la imagen actual si no se cambia

            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    newImage = event.target.result;
                    actualizarMarcador(newName, newDescription, newImage);
                };
                reader.readAsDataURL(file);
            } else {
                actualizarMarcador(newName, newDescription, newImage);
            }
        };
    }
});

// Función para actualizar un marcador
function actualizarMarcador(name, description, imageUrl) {
    if (currentMarker) {
        currentMarker.setPopupContent(`
            <h3>${name}</h3>
            <p>${description}</p>
            ${imageUrl ? `<img src="${imageUrl}" alt="${name}" style="width: 100%; border-radius: 5px;">` : ''}
        `);

        showSidebar({ title: name, text: description, image: imageUrl }, currentMarker);

        pinForm.classList.add('hidden'); // Ocultar formulario
    }
}


// Manejar clic en el mapa para posicionar un nuevo pin
map.on('click', (e) => {
    selectedCoords = e.latlng;

    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker([selectedCoords.lat, selectedCoords.lng]).addTo(map);

    pinForm.classList.remove('hidden');
});

// Manejar el envío del formulario
pinDataForm.onsubmit = (event) => {
    event.preventDefault();

    const name = document.getElementById('pinName').value;
    const description = document.getElementById('pinDescription').value;
    const file = document.getElementById('pinImage').files[0];
    const pinType = document.querySelector('input[name="pinType"]:checked').value;
    let imageUrl = '';

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            imageUrl = event.target.result;
            agregarMarcador(name, description, imageUrl, pinType);
        };
        reader.readAsDataURL(file);
    } else {
        agregarMarcador(name, description, null, pinType);
    }
};

// Cargar los pines al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarPinesDesdeLocalStorage();
});

// Botón cancelar
cancelButton.addEventListener('click', () => {
    if (tempMarker) map.removeLayer(tempMarker);
    pinForm.classList.add('hidden');
    pinDataForm.reset();
    tempMarker = null;
    selectedCoords = null;
});

// Cerrar la pestaña lateral
closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Detectar clic en el mapa para agregar un nuevo pin
map.on('click', (e) => {
    // Si ya hay un marcador temporal, lo eliminamos
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Obtener las coordenadas del clic
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Crear un marcador temporal
    currentMarker = L.marker([lat, lng]).addTo(map);

    // Ocultar el sidebar al hacer clic en el mapa
    sidebar.classList.remove('open');  // Esto oculta el sidebar

    // Mostrar el formulario para agregar el pin
    pinForm.classList.remove('hidden');  // Mostrar formulario de agregar pin
});

// Configuración de Firebase (reemplaza con tus credenciales obtenidas en Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyAEUxk7uxU5DEm68HpgYVtKRCtWFxkUHRM",
    authDomain: "mapabuin.firebaseapp.com",
    databaseURL: "https://mapabuin-default-rtdb.firebaseio.com",
    projectId: "mapabuin",
    storageBucket: "mapabuin.firebasestorage.app",
    messagingSenderId: "432370344278",
    appId: "1:432370344278:web:8f04f11c96a1818b1f36f7",
    measurementId: "G-YJ2D0J042J"
};

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);

// Obtener la referencia a Firestore
const db = firebase.firestore();

function guardarPin(name, description, lat, lng, imageUrl) {
    // Referencia a la colección "pines" en Firestore
    const pinsCollection = db.collection("pines");

    // Agregar un nuevo documento con los datos del pin
    pinsCollection.add({
        name: name,
        description: description,
        coordinates: new firebase.firestore.GeoPoint(lat, lng),
        imageUrl: imageUrl || ''
    })
    .then((docRef) => {
        console.log("Pin guardado con ID: ", docRef.id);
    })
    .catch((error) => {
        console.error("Error al guardar el pin: ", error);
    });
}

function cargarPines() {
    // Referencia a la colección "pines"
    const pinsCollection = db.collection("pines");

    // Obtener todos los pines
    pinsCollection.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const pin = doc.data();
            const latLng = [pin.coordinates.latitude, pin.coordinates.longitude];

            // Agregar marcador en el mapa
            L.marker(latLng)
                .addTo(map)
                .bindPopup(`<strong>${pin.name}</strong><br>${pin.description}<br><img src="${pin.imageUrl}" alt="${pin.name}" width="100">`);
        });
    }).catch((error) => {
        console.error("Error al obtener los pines: ", error);
    });
}

window.onload = function() {
    cargarPines();  // Cargar pines de Firestore cuando se inicia la página
};









