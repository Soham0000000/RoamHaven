if (typeof mapToken !== "undefined" && mapToken && document.getElementById("map")) {
    mapboxgl.accessToken = mapToken;

    // Safe coordinates fallback (e.g. New Delhi if coordinates missing)
    const coordinates = (typeof listing !== "undefined" && listing && listing.geometry && Array.isArray(listing.geometry.coordinates) && listing.geometry.coordinates.length === 2)
        ? listing.geometry.coordinates
        : [77.2090, 28.6139];

    try {
        const map = new mapboxgl.Map({
            container: 'map',
            style: "mapbox://styles/mapbox/streets-v12",
            center: coordinates,
            zoom: 10
        });

        // Add navigation controls (zoom & rotation)
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Custom styled popup
        const listingTitle = (typeof listing !== "undefined" && listing && listing.title) ? listing.title : "Haven Location";
        const popupContent = `
            <div style="padding: 6px; font-family: 'Plus Jakarta Sans', sans-serif;">
                <h6 style="margin: 0 0 4px 0; font-weight: 700; color: #1e293b;">${listingTitle}</h6>
                <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Exact address provided upon reservation confirmation.</p>
            </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 28, closeButton: false })
            .setHTML(popupContent);

        // Marker with RoamHaven signature coral color
        new mapboxgl.Marker({ color: "#FF385C" })
            .setLngLat(coordinates)
            .setPopup(popup)
            .addTo(map);
    } catch (e) {
        console.warn("Mapbox initialization note:", e.message);
    }
}
 
