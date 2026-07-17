import "./style.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css"
import "@raruto/leaflet-elevation/src/index.js";
import "@raruto/leaflet-elevation/src/index.css";

var map = L.map('map').setView([48.866667, 2.333333], 15);
let marker = null;
let idgpx = null;
let currPolyline = null;

var elevation_options = {
    theme: "lightblue-theme",
    autohide: false,
    imperial: false,
}

var controlElevation = L.control.elevation(elevation_options).addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.on("click", (event) => {
    var lat = event.latlng.lat;
    var lon = event.latlng.lng;

    if (marker) {
        marker.remove();
    };

    marker = L.marker([lat, lon]).addTo(map);
    marker.on("click", (event)=>{
            marker.remove();
    });
});

function setCurrentPosition (position) {
    map.setView([position.coords.latitude, position.coords.longitude], 15);
};

async function getRoute(url) {
    var response = await fetch(url);
    var data = await response.json();
    return data;
};

async function setIPPosition (error=null) {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    map.setView([data.latitude, data.longitude]);
};

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setCurrentPosition, setIPPosition);
} else {
    setIPPosition();
};

document.getElementById("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (marker) {
        if (currPolyline) {
            currPolyline.remove();
        }
        const input = document.getElementById("loop-distance");

        console.log(input);
        console.log(input.value);
        console.log(document.activeElement);

        //var dist = document.getElementById("loop-distance").value;
        var dist = event.target.elements["loop-distance"].value
        const lat = marker.getLatLng().lat;
        const lon = marker.getLatLng().lng;

        const url = new URL("http://192.168.1.20:5000/generate");
        url.searchParams.set("lat", lat);
        url.searchParams.set("lon", lon);
        url.searchParams.set("dist", dist);

        console.log(url.toString());

        const routeInfo = await getRoute(url);
        idgpx = routeInfo.id;

        var Route = routeInfo.route;

        var listPoints = [];
        for (const point of Route) {
            listPoints.push([point.lat, point.lon]);
        };

        const geojson = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: Route.map(p => [
                    p.lon,
                    p.lat,
                    p.elev
                ])
            },
            properties: {}
        };

        //controlElevation.clear();

        controlElevation.addData(geojson);

        currPolyline = L.geoJSON(geojson).addTo(map);//new L.Polyline(listPoints).addTo(map);

    } else {
        alert("Vous devez donner un point de départ");
    };

});